import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { VolunteerTipStatus } from '../../entities/volunteer-tip.entity';

export class ReviewVolunteerTipDto {
  @IsEnum(VolunteerTipStatus)
  status: VolunteerTipStatus;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  reviewNotes?: string;
}
