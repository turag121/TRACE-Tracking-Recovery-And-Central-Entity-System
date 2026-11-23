import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RequestReportInformationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;
}
