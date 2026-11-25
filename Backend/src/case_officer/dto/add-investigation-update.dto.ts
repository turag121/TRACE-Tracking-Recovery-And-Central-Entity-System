import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AddInvestigationUpdateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  updateText: string;
}
