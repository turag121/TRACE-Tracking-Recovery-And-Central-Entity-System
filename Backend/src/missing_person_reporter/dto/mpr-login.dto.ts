import { IsNotEmpty, IsString } from 'class-validator';

export class MprLoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
