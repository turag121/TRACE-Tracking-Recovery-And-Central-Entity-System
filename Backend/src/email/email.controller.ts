import { Body, Controller, Post } from '@nestjs/common';
import { ResendEmailOtpDto } from './dto/resend-email-otp.dto';
import { VerifyEmailOtpDto } from './dto/verify-email-otp.dto';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyEmailOtpDto) {
    return this.emailService.verifyOtp(dto.verificationToken, dto.otp, dto.purpose);
  }

  @Post('resend-otp')
  resendOtp(@Body() dto: ResendEmailOtpDto) {
    return this.emailService.resendOtp(dto.verificationToken, dto.purpose);
  }
}
