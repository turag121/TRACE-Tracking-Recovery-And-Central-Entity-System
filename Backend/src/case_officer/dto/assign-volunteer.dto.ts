import { IsNotEmpty, IsString } from 'class-validator';

export class AssignVolunteerDto {
  @IsString()
  @IsNotEmpty()
  volunteerId: string;
}
