import { IsNotEmpty, IsString } from 'class-validator';

export class VolunteerLoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
