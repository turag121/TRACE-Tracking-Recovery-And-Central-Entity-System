import { IsNotEmpty, IsString } from 'class-validator';

export class CaseOfficerMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}
