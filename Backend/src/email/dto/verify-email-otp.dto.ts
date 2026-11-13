import { IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';
import { EmailVerificationPurpose } from '../../entities/email-verification.entity';

export class VerifyEmailOtpDto {
  @IsString()
  @IsNotEmpty()
  verificationToken: string;

  @IsString()
  @Length(6, 6)
  otp: string;

  @IsEnum(EmailVerificationPurpose)
  purpose: EmailVerificationPurpose;
}
