import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyMprRegistrationDto {
  @IsString()
  @IsNotEmpty()
  verificationToken: string;

  @IsString()
  @Length(6, 6)
  otp: string;
}
