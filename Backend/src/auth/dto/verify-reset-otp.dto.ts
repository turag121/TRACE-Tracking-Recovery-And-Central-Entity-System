import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyResetOtpDto {
  @IsString()
  @IsNotEmpty()
  verificationToken: string;

  @IsString()
  @Length(6, 6)
  otp: string;
}
