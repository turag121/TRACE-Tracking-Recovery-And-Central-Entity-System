import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from '../email/email.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VolunteerGuard } from '../auth/volunteer.guard';
import { InvestigationUpdate } from '../entities/investigation-update.entity';
import { MissingPersonReport } from '../entities/missing-person-report.entity';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { VolunteerAssignment } from '../entities/volunteer-assignment.entity';
import { VolunteerTip } from '../entities/volunteer-tip.entity';
import { VolunteerController } from './volunteer.controller';
import { VolunteerService } from './volunteer.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      MissingPersonReport,
      VolunteerAssignment,
      VolunteerTip,
      InvestigationUpdate,
      Notification,
    ]),
    EmailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'development-secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [VolunteerController],
  providers: [VolunteerService, JwtAuthGuard, VolunteerGuard],
})
export class VolunteerModule {}
