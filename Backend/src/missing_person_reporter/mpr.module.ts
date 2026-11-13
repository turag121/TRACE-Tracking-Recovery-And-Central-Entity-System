import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MprGuard } from '../auth/mpr.guard';
import { CaseOfficerMessage } from '../entities/case-officer-message.entity';
import { FoundPersonReport } from '../entities/found-person-report.entity';
import { InvestigationUpdate } from '../entities/investigation-update.entity';
import { MissingPersonReport } from '../entities/missing-person-report.entity';
import { Notification } from '../entities/notification.entity';
import { ReportAdditionalInfo } from '../entities/report-additional-info.entity';
import { User } from '../entities/user.entity';
import { VolunteerAssignment } from '../entities/volunteer-assignment.entity';
import { EmailModule } from '../email/email.module';
import { MprController } from './mpr.controller';
import { MprService } from './mpr.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      MissingPersonReport,
      InvestigationUpdate,
      VolunteerAssignment,
      FoundPersonReport,
      ReportAdditionalInfo,
      CaseOfficerMessage,
      Notification,
    ]),
    EmailModule,
    JwtModule.register({ secret: process.env.JWT_SECRET || 'development-secret', signOptions: { expiresIn: '1d' } }),
  ],
  controllers: [MprController],
  providers: [MprService, JwtAuthGuard, MprGuard, AdminGuard],
})
export class MprModule {}
