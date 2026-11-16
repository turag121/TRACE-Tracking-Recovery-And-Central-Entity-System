import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ResendEmailOtpDto } from './dto/resend-email-otp.dto';
import { VerifyEmailOtpDto } from './dto/verify-email-otp.dto';
import { EmailVerificationPurpose } from '../entities/email-verification.entity';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyEmailOtpDto) {
    if (dto.purpose === EmailVerificationPurpose.PASSWORD_RESET) {
      return this.emailService.verifyPasswordResetOtp(dto.verificationToken, dto.otp);
    }
    throw new BadRequestException('Use the role-specific registration verification endpoint');
  }

  @Post('resend-otp')
  resendOtp(@Body() dto: ResendEmailOtpDto) {
    return this.emailService.resendOtp(dto.verificationToken, dto.purpose);
  }
}
