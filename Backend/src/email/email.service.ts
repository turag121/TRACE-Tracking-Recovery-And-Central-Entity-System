import { randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as nodemailer from 'nodemailer';
import { DataSource, Repository } from 'typeorm';
import { EmailVerification, EmailVerificationPurpose } from '../entities/email-verification.entity';
import { User, UserRole } from '../entities/user.entity';

interface VerificationToken {
  sub: string;
  email: string;
  role: UserRole;
  purpose: EmailVerificationPurpose;
}

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(EmailVerification)
    private readonly verificationRepo: Repository<EmailVerification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: Number(this.configService.get<string>('MAIL_PORT') || 587),
      secure: Number(this.configService.get<string>('MAIL_PORT') || 587) === 465,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  async generateAndSendOtp(userId: string, purpose: EmailVerificationPurpose) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.invalidateActiveOtp(userId, purpose);
    const otp = randomInt(100000, 1000000).toString();
    const verification = this.verificationRepo.create({
      userId,
      otpHash: await bcrypt.hash(otp, 10),
      purpose,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      isUsed: false,
      attempts: 0,
    });
    const saved = await this.verificationRepo.save(verification);

    try {
      await this.sendEmail(
        user.email,
        'TRACE - Email Verification Code',
        `Your TRACE verification code is ${otp}. It expires in 5 minutes.`,
      );
    } catch (error) {
      await this.verificationRepo.delete(saved.id);
      throw new BadRequestException('Verification email could not be sent. Please try again.');
    }

    return this.createVerificationToken(user, purpose);
  }

  async verifyOtp(
    verificationToken: string,
    otp: string,
    purpose: EmailVerificationPurpose,
  ) {
    const token = this.verifyToken(verificationToken, purpose);
    return this.dataSource.transaction(async (manager) => {
      const verification = await manager.findOne(EmailVerification, {
        where: { userId: token.sub, purpose, isUsed: false },
        order: { createdAt: 'DESC' },
        lock: { mode: 'pessimistic_write' },
      });
      if (!verification) throw new BadRequestException('No active verification code found');
      if (verification.expiresAt.getTime() < Date.now()) {
        throw new BadRequestException('Verification code has expired');
      }
      if (verification.attempts >= 5) {
        throw new HttpException('Maximum verification attempts exceeded', HttpStatus.TOO_MANY_REQUESTS);
      }

      const isCorrect = await bcrypt.compare(otp, verification.otpHash);
      if (!isCorrect) {
        verification.attempts += 1;
        await manager.save(verification);
        throw new BadRequestException('Invalid verification code');
      }

      verification.isUsed = true;
      await manager.save(verification);
      const user = await manager.findOne(User, { where: { id: token.sub } });
      if (!user || user.role !== token.role) throw new BadRequestException('Invalid verification account');
      if (purpose === EmailVerificationPurpose.REGISTRATION) {
        user.isEmailVerified = true;
        user.isActive = true;
        await manager.save(user);
      }
      return user;
    }).then(async (user) => {
      if (purpose === EmailVerificationPurpose.REGISTRATION) {
        await this.sendRegistrationConfirmationEmail(user.email);
      }
      return {
        message: 'Your email has been verified. MPR registration completed successfully.',
        registrationCompleted: purpose === EmailVerificationPurpose.REGISTRATION,
      };
    });
  }

  async resendOtp(verificationToken: string, purpose: EmailVerificationPurpose) {
    const token = this.verifyToken(verificationToken, purpose);
    const user = await this.userRepo.findOne({ where: { id: token.sub, role: token.role } });
    if (!user) throw new NotFoundException('User not found');

    const recent = await this.verificationRepo.findOne({
      where: { userId: user.id, purpose },
      order: { createdAt: 'DESC' },
    });
    if (recent && recent.createdAt.getTime() > Date.now() - 60 * 1000) {
      throw new HttpException('Please wait before requesting another code', HttpStatus.TOO_MANY_REQUESTS);
    }

    const recentCount = await this.verificationRepo
      .createQueryBuilder('verification')
      .where('verification.userId = :userId', { userId: user.id })
      .andWhere('verification.purpose = :purpose', { purpose })
      .andWhere('verification.createdAt > :since', { since: new Date(Date.now() - 60 * 60 * 1000) })
      .getCount();
    if (recentCount >= 5) {
      throw new HttpException('Too many verification requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    return { verificationToken: await this.generateAndSendOtp(user.id, purpose) };
  }

  async sendRegistrationConfirmationEmail(email: string) {
    await this.sendEmail(
      email,
      'TRACE - Registration Completed Successfully',
      'Welcome to TRACE!\n\nYour email address has been successfully verified, and your Missing Person Reporter account registration is now complete.\n\nYou can now log in to your TRACE account.\n\nThank you for joining TRACE.\n\nTRACE Team',
    );
  }

  private async invalidateActiveOtp(userId: string, purpose: EmailVerificationPurpose) {
    await this.verificationRepo
      .createQueryBuilder()
      .update(EmailVerification)
      .set({ isUsed: true })
      .where('userId = :userId', { userId })
      .andWhere('purpose = :purpose', { purpose })
      .andWhere('isUsed = false')
      .execute();
  }

  private createVerificationToken(user: User, purpose: EmailVerificationPurpose) {
    return this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role, purpose },
      { expiresIn: '10m' },
    );
  }

  private verifyToken(token: string, purpose: EmailVerificationPurpose) {
    try {
      const payload = this.jwtService.verify<VerificationToken>(token);
      if (payload.purpose !== purpose || payload.role !== UserRole.MPR) {
        throw new BadRequestException('Invalid verification token');
      }
      return payload;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Invalid or expired verification token');
    }
  }

  private async sendEmail(to: string, subject: string, text: string) {
    const from = this.configService.get<string>('MAIL_FROM');
    const user = this.configService.get<string>('MAIL_USER');
    if (!from || !user) throw new Error('Email configuration is incomplete');
    await this.transporter.sendMail({ from, to, subject, text });
  }
}
