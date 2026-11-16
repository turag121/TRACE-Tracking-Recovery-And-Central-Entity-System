import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from '../email/email.service';
import { User } from '../entities/user.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (user && user.isActive) {
      await this.emailService.startPasswordReset(user);
    }
    return { message: 'If an eligible account exists, a password reset code has been sent.' };
  }

  verifyResetOtp(verificationToken: string, otp: string) {
    return this.emailService.verifyPasswordResetOtp(verificationToken, otp);
  }

  resetPassword(dto: ResetPasswordDto) {
    return this.emailService.resetPassword(dto.resetToken, dto.newPassword);
  }
}
