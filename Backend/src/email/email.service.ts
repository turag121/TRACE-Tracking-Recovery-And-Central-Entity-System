import { randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as nodemailer from 'nodemailer';
import { DataSource, Repository } from 'typeorm';
import {
  EmailVerification,
  EmailVerificationPurpose,
  VerificationRole,
} from '../entities/email-verification.entity';
import { User } from '../entities/user.entity';

interface VerificationToken {
  sub: string;
  purpose: EmailVerificationPurpose;
}

export interface RegistrationData {
  name: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  address: string;
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

  async startRegistration(data: RegistrationData, role: VerificationRole) {
    await this.invalidateActiveRecords(data.email, EmailVerificationPurpose.REGISTRATION);
    return this.createAndSendOtp(
      data.email,
      EmailVerificationPurpose.REGISTRATION,
      role,
      null,
      data,
    );
  }

  async startPasswordReset(user: User) {
    await this.invalidateActiveRecords(user.email, EmailVerificationPurpose.PASSWORD_RESET);
    return this.createAndSendOtp(
      user.email,
      EmailVerificationPurpose.PASSWORD_RESET,
      null,
      user.id,
      null,
    );
  }

  async verifyRegistrationOtp(token: string, otp: string, role: VerificationRole) {
    const record = await this.verifyOtpRecord(token, otp, EmailVerificationPurpose.REGISTRATION, false);
    if (record.role !== role || !record.verificationData) {
      throw new BadRequestException('Invalid registration verification');
    }
    return record;
  }

  async verifyPasswordResetOtp(token: string, otp: string) {
    const record = await this.verifyOtpRecord(token, otp, EmailVerificationPurpose.PASSWORD_RESET, true);
    if (!record.userId) throw new BadRequestException('Invalid password reset verification');

    return {
      resetToken: this.jwtService.sign(
        { sub: record.id, purpose: EmailVerificationPurpose.PASSWORD_RESET },
        { expiresIn: '10m' },
      ),
    };
  }

  async consumeRegistration(recordId: string) {
    const record = await this.verificationRepo.findOne({ where: { id: recordId, isUsed: false } });
    if (!record || !record.verifiedAt || !record.verificationData) {
      throw new BadRequestException('Registration verification has already been completed');
    }
    const data = record.verificationData;
    record.isUsed = true;
    record.verificationData = null;
    await this.verificationRepo.save(record);
    return data as unknown as RegistrationData;
  }

  async resetPassword(resetToken: string, newPassword: string) {
    const payload = this.verifyResetToken(resetToken);
    return this.dataSource.transaction(async (manager) => {
      const record = await manager.findOne(EmailVerification, {
        where: { id: payload.sub, purpose: EmailVerificationPurpose.PASSWORD_RESET, isUsed: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!record || !record.userId || record.verificationData) {
        throw new BadRequestException('Invalid or already used reset token');
      }

      const user = await manager.findOne(User, { where: { id: record.userId } });
      if (!user) throw new NotFoundException('User not found');
      user.password = await bcrypt.hash(newPassword, 10);
      record.verificationData = { passwordResetCompleted: 'true' };
      await manager.save(user);
      await manager.save(record);
      return { message: 'Password reset successfully' };
    });
  }

  async resendOtp(token: string, purpose: EmailVerificationPurpose) {
    const record = this.verifyToken(token, purpose);
    const current = await this.verificationRepo.findOne({ where: { id: record.sub } });
    if (!current || current.isUsed) throw new BadRequestException('Verification is no longer active');
    if (current.createdAt.getTime() > Date.now() - 60 * 1000) {
      throw new HttpException('Please wait before requesting another code', HttpStatus.TOO_MANY_REQUESTS);
    }

    const count = await this.verificationRepo
      .createQueryBuilder('verification')
      .where('verification.email = :email', { email: current.email })
      .andWhere('verification.purpose = :purpose', { purpose })
      .andWhere('verification.createdAt > :since', { since: new Date(Date.now() - 60 * 60 * 1000) })
      .getCount();
    if (count >= 5) throw new HttpException('Too many verification requests', HttpStatus.TOO_MANY_REQUESTS);

    return {
      verificationToken: await this.createAndSendOtp(
        current.email,
        purpose,
        current.role,
        current.userId,
        current.verificationData as unknown as RegistrationData | null,
      ),
    };
  }

  async sendRegistrationConfirmationEmail(email: string) {
    await this.sendEmail(
      email,
      'TRACE - Registration Completed Successfully',
      'Welcome to TRACE!\n\nYour email address has been successfully verified, and your registration is now complete.\n\nTRACE Team',
    );
  }

  private async createAndSendOtp(
    email: string,
    purpose: EmailVerificationPurpose,
    role: VerificationRole | null,
    userId: string | null,
    verificationData: RegistrationData | null,
  ) {
    const otp = randomInt(100000, 1000000).toString();
    const record = await this.verificationRepo.save(this.verificationRepo.create({
      email,
      purpose,
      role,
      userId,
      verificationData: verificationData ? { ...verificationData } : null,
      otpHash: await bcrypt.hash(otp, 10),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      isUsed: false,
      verifiedAt: null,
      attempts: 0,
    }));

    try {
      await this.sendEmail(email, 'TRACE - Email Verification Code', `Your TRACE verification code is ${otp}. It expires in 5 minutes.`);
    } catch {
      await this.verificationRepo.delete(record.id);
      throw new BadRequestException('Verification email could not be sent. Please try again.');
    }
    return this.jwtService.sign(
      { sub: record.id, purpose },
      { expiresIn: '10m' },
    );
  }

  private async verifyOtpRecord(
    token: string,
    otp: string,
    purpose: EmailVerificationPurpose,
    consume: boolean,
  ) {
    const payload = this.verifyToken(token, purpose);
    const verification = await this.dataSource.transaction(async (manager) => {
      const record = await manager.findOne(EmailVerification, {
        where: { id: payload.sub, purpose, isUsed: false },
        lock: { mode: 'pessimistic_write' },
      });
      if (!record) throw new BadRequestException('No active verification code found');
      if (record.expiresAt.getTime() < Date.now()) throw new BadRequestException('Verification code has expired');
      if (record.attempts >= 5) throw new HttpException('Maximum verification attempts exceeded', HttpStatus.TOO_MANY_REQUESTS);

      if (!(await bcrypt.compare(otp, record.otpHash))) {
        record.attempts += 1;
        await manager.save(record);
        return null;
      }
      if (consume) {
        record.isUsed = true;
      } else {
        record.verifiedAt = new Date();
      }
      return manager.save(record);
    });
    if (!verification) throw new BadRequestException('Invalid verification code');
    return verification;
  }

  private async invalidateActiveRecords(email: string, purpose: EmailVerificationPurpose) {
    await this.verificationRepo
      .createQueryBuilder()
      .update(EmailVerification)
      .set({ isUsed: true })
      .where('email = :email', { email })
      .andWhere('purpose = :purpose', { purpose })
      .andWhere('isUsed = false')
      .execute();
  }

  private verifyToken(token: string, purpose: EmailVerificationPurpose) {
    try {
      const payload = this.jwtService.verify<VerificationToken>(token);
      if (payload.purpose !== purpose) throw new BadRequestException('Invalid verification token');
      return payload;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Invalid or expired verification token');
    }
  }

  private verifyResetToken(token: string) {
    return this.verifyToken(token, EmailVerificationPurpose.PASSWORD_RESET);
  }

  private async sendEmail(to: string, subject: string, text: string) {
    const from = this.configService.get<string>('MAIL_FROM');
    const user = this.configService.get<string>('MAIL_USER');
    if (!from || !user) throw new Error('Email configuration is incomplete');
    await this.transporter.sendMail({ from, to, subject, text });
  }
}
