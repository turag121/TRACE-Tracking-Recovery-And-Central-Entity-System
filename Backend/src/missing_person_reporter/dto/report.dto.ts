import { Type } from 'class-transformer';
import { IsDateString, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  personName: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(150)
  age: number;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsString()
  @IsNotEmpty()
  physicalDescription: string;

  @IsString()
  @IsNotEmpty()
  lastSeenLocation: string;

  @IsDateString()
  lastSeenDate: string;

  @IsOptional()
  @IsString()
  additionalInformation?: string;

  @IsString()
  @IsNotEmpty()
  contactPhone: string;

  @IsEmail()
  contactEmail: string;
}

export class UpdateReportDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  personName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(150)
  age?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  gender?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  physicalDescription?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastSeenLocation?: string;

  @IsOptional()
  @IsDateString()
  lastSeenDate?: string;

  @IsOptional()
  @IsString()
  additionalInformation?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;
}
