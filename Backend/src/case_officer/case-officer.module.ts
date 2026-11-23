import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaseOfficerGuard } from '../auth/case-officer.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CaseOfficerMessage } from '../entities/case-officer-message.entity';
import { FoundPersonReport } from '../entities/found-person-report.entity';
import { InvestigationUpdate } from '../entities/investigation-update.entity';
import { MissingPersonReport } from '../entities/missing-person-report.entity';
import { Notification } from '../entities/notification.entity';
import { ReportAdditionalInfo } from '../entities/report-additional-info.entity';
import { User } from '../entities/user.entity';
import { VolunteerAssignment } from '../entities/volunteer-assignment.entity';
import { VolunteerTip } from '../entities/volunteer-tip.entity';
import { CaseOfficerController } from './case-officer.controller';
import { CaseOfficerService } from './case-officer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      MissingPersonReport,
      InvestigationUpdate,
      VolunteerAssignment,
      VolunteerTip,
      FoundPersonReport,
      ReportAdditionalInfo,
      CaseOfficerMessage,
      Notification,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'development-secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [CaseOfficerController],
  providers: [CaseOfficerService, JwtAuthGuard, CaseOfficerGuard],
})
export class CaseOfficerModule {}
