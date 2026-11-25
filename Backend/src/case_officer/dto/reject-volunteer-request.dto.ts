import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectVolunteerRequestDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  reason?: string;
}
