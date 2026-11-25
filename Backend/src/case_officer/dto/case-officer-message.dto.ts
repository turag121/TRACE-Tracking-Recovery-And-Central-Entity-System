import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CaseOfficerMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message: string;
}
