import * as bcrypt from 'bcrypt';
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from '../email/email.service';
import { VerificationRole } from '../entities/email-verification.entity';
import { User, UserRole } from '../entities/user.entity';
import { VolunteerRegistrationDto } from './dto/volunteer-registration.dto';

@Injectable()
export class VolunteerService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: VolunteerRegistrationDto) {
    const duplicate = await this.userRepo.findOne({ where: [{ username: dto.username }, { email: dto.email }] });
    if (duplicate) throw new ConflictException('Username or email already exists');
    const verificationToken = await this.emailService.startRegistration({
      ...dto,
      password: await bcrypt.hash(dto.password, 10),
    }, VerificationRole.VOLUNTEER);
    return {
      message: 'Registration initiated. Please check your email for the OTP.',
      email: dto.email,
      verificationRequired: true,
      verificationToken,
    };
  }

  async completeRegistration(verificationToken: string, otp: string) {
    const record = await this.emailService.verifyRegistrationOtp(
      verificationToken,
      otp,
      VerificationRole.VOLUNTEER,
    );
    if (!record.verificationData) throw new ConflictException('Registration data is missing');
    const duplicate = await this.userRepo.findOne({
      where: [
        { username: record.verificationData.username },
        { email: record.verificationData.email },
      ],
    });
    if (duplicate) throw new ConflictException('Username or email already exists');
    const user = await this.userRepo.save(this.userRepo.create({
      ...record.verificationData,
      role: UserRole.VOLUNTEER,
      isEmailVerified: true,
      isActive: true,
    }));
    await this.emailService.consumeRegistration(record.id);
    await this.emailService.sendRegistrationConfirmationEmail(user.email);
    return { message: 'Volunteer registration completed successfully.', registrationCompleted: true };
  }
}
