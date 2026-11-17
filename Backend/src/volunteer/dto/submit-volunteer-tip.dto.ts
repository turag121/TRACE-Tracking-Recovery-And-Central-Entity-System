import { IsDateString, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SubmitVolunteerTipDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  sightingLocation: string;

  @IsDateString()
  sightingDateTime: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;
}
