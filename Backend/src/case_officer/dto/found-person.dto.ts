import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class FoundPersonDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  information: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @IsDateString()
  foundAt?: string;
}
