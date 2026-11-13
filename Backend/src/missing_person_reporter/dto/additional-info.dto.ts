import { IsNotEmpty, IsString } from 'class-validator';

export class AdditionalInfoDto {
  @IsString()
  @IsNotEmpty()
  information: string;
}
