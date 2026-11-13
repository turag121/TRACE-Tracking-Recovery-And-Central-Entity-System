import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FoundPersonDto {
  @IsString()
  @IsNotEmpty()
  information: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDateString()
  foundAt?: string;
}
