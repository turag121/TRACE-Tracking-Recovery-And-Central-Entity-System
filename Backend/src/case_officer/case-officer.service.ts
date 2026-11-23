import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaseOfficerMessage } from '../entities/case-officer-message.entity';
import { FoundPersonReport } from '../entities/found-person-report.entity';
import { InvestigationUpdate } from '../entities/investigation-update.entity';
import { MissingPersonReport } from '../entities/missing-person-report.entity';
import { Notification } from '../entities/notification.entity';
import { ReportAdditionalInfo } from '../entities/report-additional-info.entity';
import { User } from '../entities/user.entity';
import { VolunteerAssignment } from '../entities/volunteer-assignment.entity';
import { VolunteerTip } from '../entities/volunteer-tip.entity';

@Injectable()
export class CaseOfficerService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(MissingPersonReport) private readonly reportRepo: Repository<MissingPersonReport>,
    @InjectRepository(InvestigationUpdate) private readonly updateRepo: Repository<InvestigationUpdate>,
    @InjectRepository(VolunteerAssignment) private readonly assignmentRepo: Repository<VolunteerAssignment>,
    @InjectRepository(VolunteerTip) private readonly tipRepo: Repository<VolunteerTip>,
    @InjectRepository(FoundPersonReport) private readonly foundRepo: Repository<FoundPersonReport>,
    @InjectRepository(ReportAdditionalInfo) private readonly additionalInfoRepo: Repository<ReportAdditionalInfo>,
    @InjectRepository(CaseOfficerMessage) private readonly messageRepo: Repository<CaseOfficerMessage>,
    @InjectRepository(Notification) private readonly notificationRepo: Repository<Notification>,
  ) {}
}
