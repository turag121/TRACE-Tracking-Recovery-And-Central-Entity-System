import { IsEnum } from 'class-validator';
import { ReportStatus } from '../../entities/missing-person-report.entity';

export class UpdateReportStatusDto {
  @IsEnum(ReportStatus)
  status: ReportStatus;
}
