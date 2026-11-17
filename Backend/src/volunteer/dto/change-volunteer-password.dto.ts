import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangeVolunteerPasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}
