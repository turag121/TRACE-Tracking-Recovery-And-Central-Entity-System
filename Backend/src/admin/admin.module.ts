import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActivityLog } from '../entities/activity-log.entity';
import { Complaint } from '../entities/complaint.entity';
import { MissingPersonReport } from '../entities/missing-person-report.entity';
import { SuspiciousReport } from '../entities/suspicious-report.entity';
import { User } from '../entities/user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, MissingPersonReport, ActivityLog, Complaint, SuspiciousReport]),
    JwtModule.register({ secret: process.env.JWT_SECRET || 'development-secret', signOptions: { expiresIn: '1d' } }),
  ],
  controllers: [AdminController],
  providers: [AdminService, JwtAuthGuard, AdminGuard],
})
export class AdminModule {}
