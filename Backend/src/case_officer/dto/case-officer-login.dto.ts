import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CaseOfficerLoginDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  username?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  identifier?: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
