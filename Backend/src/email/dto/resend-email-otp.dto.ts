import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { EmailVerificationPurpose } from '../../entities/email-verification.entity';

export class ResendEmailOtpDto {
  @IsString()
  @IsNotEmpty()
  verificationToken: string;

  @IsEnum(EmailVerificationPurpose)
  purpose: EmailVerificationPurpose;
}
