import { IsEnum } from 'class-validator';
import { VolunteerAssignmentStatus } from '../../entities/volunteer-assignment.entity';

export class UpdateVolunteerAssignmentStatusDto {
  @IsEnum(VolunteerAssignmentStatus)
  status: VolunteerAssignmentStatus;
}
