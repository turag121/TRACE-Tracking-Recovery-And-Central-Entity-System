import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { CaseOfficerMessage } from '../entities/case-officer-message.entity';
import { FoundPersonReport } from '../entities/found-person-report.entity';
import { InvestigationUpdate } from '../entities/investigation-update.entity';
import { MissingPersonReport, ReportStatus } from '../entities/missing-person-report.entity';
import { Notification } from '../entities/notification.entity';
import { ReportAdditionalInfo } from '../entities/report-additional-info.entity';
import { User, UserRole } from '../entities/user.entity';
import {
  VolunteerAssignment,
  VolunteerAssignmentStatus,
} from '../entities/volunteer-assignment.entity';
import { VolunteerTip, VolunteerTipStatus } from '../entities/volunteer-tip.entity';
import { AddInvestigationUpdateDto } from './dto/add-investigation-update.dto';
import { AssignVolunteerDto } from './dto/assign-volunteer.dto';
import { CaseOfficerLoginDto } from './dto/case-officer-login.dto';
import { CaseOfficerMessageDto } from './dto/case-officer-message.dto';
import { ChangeCaseOfficerPasswordDto } from './dto/change-case-officer-password.dto';
import { FoundPersonDto } from './dto/found-person.dto';
import { RejectReportDto } from './dto/reject-report.dto';
import { RejectVolunteerRequestDto } from './dto/reject-volunteer-request.dto';
import { ReportFilterDto } from './dto/report-filter.dto';
import { RequestReportInformationDto } from './dto/request-report-information.dto';
import { ReviewVolunteerTipDto } from './dto/review-volunteer-tip.dto';
import { UpdateCaseOfficerProfileDto } from './dto/update-case-officer-profile.dto';
import { UpdateInvestigationStatusDto } from './dto/update-investigation-status.dto';

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
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: CaseOfficerLoginDto) {
    const identifier = dto.identifier || dto.username;
    if (!identifier) throw new BadRequestException('Username or email is required');
    const user = await this.userRepo.findOne({
      where: [
        { username: identifier, role: UserRole.CASE_OFFICER },
        { email: identifier, role: UserRole.CASE_OFFICER },
      ],
    });
    if (!user || !user.isActive || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid Case Officer credentials');
    }
    if (!user.isEmailVerified) throw new UnauthorizedException('Please verify your email before logging in');
    return {
      accessToken: this.jwtService.sign({ sub: user.id, role: user.role, username: user.username }),
    };
  }

  async getDashboard(userId: string) {
    await this.getOfficer(userId);
    const [totalAssigned, pendingVerification, activeInvestigations, completedCases, assignmentRows, recentActivities] =
      await Promise.all([
        this.reportRepo.count({ where: { caseOfficerId: userId } }),
        this.reportRepo.count({ where: { caseOfficerId: userId, status: ReportStatus.PENDING } }),
        this.reportRepo.count({ where: { caseOfficerId: userId, status: ReportStatus.ACTIVE } }),
        this.reportRepo.count({ where: { caseOfficerId: userId, status: ReportStatus.CLOSED } }),
        this.assignmentRepo.find({
          where: { status: In([VolunteerAssignmentStatus.PENDING, VolunteerAssignmentStatus.ACTIVE]) },
          select: { reportId: true, volunteerId: true },
        }),
        this.updateRepo.find({
          where: { caseOfficerId: userId },
          order: { createdAt: 'DESC' },
          take: 10,
        }),
      ]);
    const assignedReports = await this.reportRepo.find({
      where: { caseOfficerId: userId },
      select: { id: true },
    });
    const assignedReportIds = assignedReports.map((report) => report.id);
    const matchingAssignments = assignmentRows.filter((assignment) => assignedReportIds.includes(assignment.reportId));
    const totalAssignedVolunteers = new Set(matchingAssignments.map((assignment) => assignment.volunteerId)).size;
    return {
      totalAssignedCases: totalAssigned,
      pendingVerificationCases: pendingVerification,
      activeInvestigations,
      completedCases,
      totalAssignedVolunteers,
      recentInvestigationActivities: recentActivities,
    };
  }

  async getReports(userId: string, filter: ReportFilterDto) {
    await this.getOfficer(userId);
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const query = this.reportRepo.createQueryBuilder('report')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .leftJoinAndSelect('report.caseOfficer', 'caseOfficer')
      .where(new Brackets((where) => {
        where.where('report.caseOfficerId = :userId', { userId })
          .orWhere('report.status = :pending AND report.caseOfficerId IS NULL', { pending: ReportStatus.PENDING });
      }));
    if (filter.status) query.andWhere('report.status = :status', { status: filter.status });
    if (filter.submittedFrom) query.andWhere('report.createdAt >= :submittedFrom', { submittedFrom: `${filter.submittedFrom}T00:00:00.000Z` });
    if (filter.submittedTo) query.andWhere('report.createdAt <= :submittedTo', { submittedTo: `${filter.submittedTo}T23:59:59.999Z` });
    const [data, total] = await query
      .orderBy('report.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data: data.map((report) => this.safeReport(report)), page, limit, total };
  }

  async getReport(userId: string, reportId: string) {
    const report = await this.getAccessibleReport(userId, reportId);
    const [updates, additionalInformation, assignments] = await Promise.all([
      this.updateRepo.find({ where: { reportId }, order: { createdAt: 'DESC' } }),
      this.additionalInfoRepo.find({ where: { reportId }, order: { createdAt: 'DESC' } }),
      this.assignmentRepo.find({ where: { reportId }, order: { assignedAt: 'DESC' } }),
    ]);
    return {
      ...this.safeReport(report),
      investigationUpdates: updates,
      additionalInformation,
      volunteerAssignments: assignments,
    };
  }

  async approveReport(userId: string, reportId: string) {
    const report = await this.getOwnedReport(userId, reportId);
    if (report.status !== ReportStatus.PENDING) throw new BadRequestException('Only pending reports can be approved');
    report.status = ReportStatus.ACTIVE;
    report.caseOfficerId = userId;
    const saved = await this.reportRepo.save(report);
    await this.notify(report.reporterId, reportId, 'Report approved', 'Your missing person report has been approved and an investigation is now active.');
    return this.safeReport(saved);
  }

  async rejectReport(userId: string, reportId: string, dto: RejectReportDto) {
    const report = await this.getOwnedReport(userId, reportId);
    if (report.status === ReportStatus.CLOSED || report.status === ReportStatus.REJECTED) {
      throw new BadRequestException('This report cannot be rejected');
    }
    report.status = ReportStatus.REJECTED;
    report.caseOfficerId = userId;
    const saved = await this.reportRepo.save(report);
    await this.notify(report.reporterId, reportId, 'Report rejected', `Your missing person report was rejected. Reason: ${dto.reason}`);
    return this.safeReport(saved);
  }

  async requestAdditionalInformation(userId: string, reportId: string, dto: RequestReportInformationDto) {
    const report = await this.getOwnedReport(userId, reportId);
    await this.notify(report.reporterId, reportId, 'Additional information requested', dto.message);
    return { message: 'Additional information request sent to the reporter.', request: dto.message };
  }

  async getAdditionalInformation(userId: string, reportId: string) {
    await this.getOwnedReport(userId, reportId);
    return this.additionalInfoRepo.find({ where: { reportId }, order: { createdAt: 'DESC' } });
  }

  async getInvestigations(userId: string) {
    await this.getOfficer(userId);
    return this.reportRepo.find({
      where: [
        { caseOfficerId: userId, status: ReportStatus.ACTIVE },
        { caseOfficerId: userId, status: ReportStatus.FOUND },
        { caseOfficerId: userId, status: ReportStatus.CLOSED },
      ],
      relations: { reporter: true },
      order: { updatedAt: 'DESC' },
    });
  }

  async getInvestigation(userId: string, reportId: string) {
    const report = await this.getOwnedReport(userId, reportId);
    const updates = await this.updateRepo.find({ where: { reportId }, order: { createdAt: 'DESC' } });
    return { ...this.safeReport(report), investigationUpdates: updates };
  }

  async updateInvestigationStatus(userId: string, reportId: string, dto: UpdateInvestigationStatusDto) {
    const report = await this.getOwnedReport(userId, reportId);
    const allowed =
      (report.status === ReportStatus.PENDING && dto.status === ReportStatus.ACTIVE) ||
      (report.status === ReportStatus.ACTIVE && (dto.status === ReportStatus.FOUND || dto.status === ReportStatus.CLOSED)) ||
      (report.status === ReportStatus.FOUND && dto.status === ReportStatus.CLOSED);
    if (!allowed) throw new BadRequestException(`Invalid status transition from ${report.status} to ${dto.status}`);
    report.status = dto.status;
    const saved = await this.reportRepo.save(report);
    await this.updateRepo.save(this.updateRepo.create({
      reportId,
      caseOfficerId: userId,
      updateText: `Investigation status changed to ${dto.status}.`,
    }));
    await this.notify(report.reporterId, reportId, 'Investigation status updated', `The investigation status changed to ${dto.status}.`);
    return this.safeReport(saved);
  }

  async addInvestigationUpdate(userId: string, reportId: string, dto: AddInvestigationUpdateDto) {
    await this.getOwnedReport(userId, reportId);
    const saved = await this.updateRepo.save(this.updateRepo.create({
      reportId,
      caseOfficerId: userId,
      updateText: dto.updateText,
    }));
    const report = await this.reportRepo.findOne({ where: { id: reportId } });
    if (report) await this.notify(report.reporterId, reportId, 'Investigation update', dto.updateText);
    return saved;
  }

  async getInvestigationUpdates(userId: string, reportId: string) {
    await this.getOwnedReport(userId, reportId);
    return this.updateRepo.find({ where: { reportId }, order: { createdAt: 'DESC' } });
  }

  async markPersonFound(userId: string, reportId: string, dto: FoundPersonDto) {
    const report = await this.getOwnedReport(userId, reportId);
    if (report.status === ReportStatus.CLOSED || report.status === ReportStatus.REJECTED) {
      throw new BadRequestException('A found-person report cannot be added to this investigation');
    }
    const found = await this.foundRepo.save(this.foundRepo.create({
      reportId,
      submittedBy: userId,
      information: dto.information,
      location: dto.location || null,
      foundAt: dto.foundAt ? new Date(dto.foundAt) : null,
    }));
    report.status = ReportStatus.FOUND;
    await this.reportRepo.save(report);
    await this.updateRepo.save(this.updateRepo.create({
      reportId,
      caseOfficerId: userId,
      updateText: 'The missing person was marked as found.',
    }));
    await this.notify(report.reporterId, reportId, 'Missing person found', dto.information);
    return found;
  }

  async closeInvestigation(userId: string, reportId: string) {
    const report = await this.getOwnedReport(userId, reportId);
    if (report.status !== ReportStatus.ACTIVE && report.status !== ReportStatus.FOUND) {
      throw new BadRequestException('Only active or found investigations can be closed');
    }
    report.status = ReportStatus.CLOSED;
    const saved = await this.reportRepo.save(report);
    await this.updateRepo.save(this.updateRepo.create({
      reportId,
      caseOfficerId: userId,
      updateText: 'The investigation was closed.',
    }));
    await this.notify(report.reporterId, reportId, 'Investigation closed', 'The investigation has been closed.');
    return this.safeReport(saved);
  }

  async getVolunteers(userId: string) {
    await this.getOfficer(userId);
    const reports = await this.reportRepo.find({ where: { caseOfficerId: userId }, select: { id: true } });
    if (!reports.length) return [];
    const assignments = await this.assignmentRepo.find({
      where: { reportId: In(reports.map((report) => report.id)), status: In([VolunteerAssignmentStatus.ACTIVE, VolunteerAssignmentStatus.COMPLETED]) },
      order: { assignedAt: 'DESC' },
    });
    const volunteerIds = [...new Set(assignments.map((assignment) => assignment.volunteerId))];
    if (!volunteerIds.length) return [];
    const volunteers = await this.userRepo.find({ where: { id: In(volunteerIds), role: UserRole.VOLUNTEER } });
    return volunteers.map((volunteer) => ({ ...this.publicUser(volunteer), assignments: assignments.filter((item) => item.volunteerId === volunteer.id) }));
  }

  async getVolunteerRequests(userId: string) {
    await this.getOfficer(userId);
    const reports = await this.reportRepo.find({ where: { caseOfficerId: userId }, select: { id: true } });
    if (!reports.length) return [];
    return this.assignmentRepo.find({
      where: { reportId: In(reports.map((report) => report.id)), status: VolunteerAssignmentStatus.PENDING },
      order: { assignedAt: 'DESC' },
    });
  }

  async approveVolunteerRequest(userId: string, assignmentId: string) {
    const assignment = await this.getOwnedAssignment(userId, assignmentId);
    if (assignment.status !== VolunteerAssignmentStatus.PENDING) throw new BadRequestException('This volunteer request is not pending');
    assignment.status = VolunteerAssignmentStatus.ACTIVE;
    const saved = await this.assignmentRepo.save(assignment);
    await this.notify(assignment.volunteerId, assignment.reportId, 'Volunteer request approved', 'Your request to participate in this investigation was approved.');
    return saved;
  }

  async rejectVolunteerRequest(userId: string, assignmentId: string, dto: RejectVolunteerRequestDto) {
    const assignment = await this.getOwnedAssignment(userId, assignmentId);
    if (assignment.status !== VolunteerAssignmentStatus.PENDING) throw new BadRequestException('This volunteer request is not pending');
    assignment.status = VolunteerAssignmentStatus.REJECTED;
    const saved = await this.assignmentRepo.save(assignment);
    await this.notify(
      assignment.volunteerId,
      assignment.reportId,
      'Volunteer request rejected',
      dto.reason || 'Your request to participate in this investigation was rejected.',
    );
    return saved;
  }

  async assignVolunteer(userId: string, reportId: string, dto: AssignVolunteerDto) {
    await this.getOwnedReport(userId, reportId);
    const volunteer = await this.userRepo.findOne({ where: { id: dto.volunteerId, role: UserRole.VOLUNTEER, isActive: true } });
    if (!volunteer) throw new NotFoundException('Active volunteer not found');
    const existing = await this.assignmentRepo.findOne({
      where: { reportId, volunteerId: dto.volunteerId },
    });
    if (existing) throw new BadRequestException('Volunteer is already assigned or has a pending request for this investigation');
    const saved = await this.assignmentRepo.save(this.assignmentRepo.create({
      reportId,
      volunteerId: dto.volunteerId,
      status: VolunteerAssignmentStatus.ACTIVE,
    }));
    await this.notify(volunteer.id, reportId, 'Volunteer assignment', 'You have been assigned to an investigation.');
    return saved;
  }

  async getInvestigationVolunteers(userId: string, reportId: string) {
    await this.getOwnedReport(userId, reportId);
    return this.assignmentRepo.find({ where: { reportId }, order: { assignedAt: 'DESC' } });
  }

  async removeVolunteerAssignment(userId: string, assignmentId: string) {
    const assignment = await this.getOwnedAssignment(userId, assignmentId);
    assignment.status = VolunteerAssignmentStatus.LEFT;
    return this.assignmentRepo.save(assignment);
  }

  async getVolunteerActivities(userId: string, volunteerId: string) {
    await this.getOfficer(userId);
    const reports = await this.reportRepo.find({ where: { caseOfficerId: userId }, select: { id: true } });
    const reportIds = reports.map((report) => report.id);
    const [assignments, tips] = reportIds.length
      ? await Promise.all([
          this.assignmentRepo.find({ where: { volunteerId, reportId: In(reportIds) }, order: { assignedAt: 'DESC' } }),
          this.tipRepo.find({ where: { volunteerId, reportId: In(reportIds) }, order: { createdAt: 'DESC' } }),
        ])
      : [[], []];
    return { assignments, tips };
  }

  async getTips(userId: string) {
    await this.getOfficer(userId);
    const reports = await this.reportRepo.find({ where: { caseOfficerId: userId }, select: { id: true } });
    if (!reports.length) return [];
    return this.tipRepo.find({
      where: { reportId: In(reports.map((report) => report.id)) },
      order: { createdAt: 'DESC' },
    });
  }

  async reviewTip(userId: string, tipId: string, dto: ReviewVolunteerTipDto) {
    await this.getOfficer(userId);
    const tip = await this.tipRepo.findOne({ where: { id: tipId } });
    if (!tip) throw new NotFoundException('Sighting tip not found');
    const report = await this.reportRepo.findOne({ where: { id: tip.reportId, caseOfficerId: userId } });
    if (!report) throw new ForbiddenException('You cannot review this sighting');
    if (dto.status !== VolunteerTipStatus.VERIFIED && dto.status !== VolunteerTipStatus.REJECTED) {
      throw new BadRequestException('Sighting status must be VERIFIED or REJECTED');
    }
    tip.verificationStatus = dto.status;
    tip.reviewedBy = userId;
    tip.reviewNotes = dto.reviewNotes || null;
    return this.tipRepo.save(tip);
  }

  async sendVolunteerInstruction(userId: string, volunteerId: string, reportId: string, message: string) {
    await this.getOfficer(userId);
    const report = await this.reportRepo.findOne({ where: { id: reportId, caseOfficerId: userId } });
    if (!report) throw new ForbiddenException('You cannot instruct volunteers for this investigation');
    const assignment = await this.assignmentRepo.findOne({ where: { reportId, volunteerId, status: VolunteerAssignmentStatus.ACTIVE } });
    if (!assignment) throw new ForbiddenException('Volunteer is not actively assigned to this investigation');
    await this.notify(volunteerId, reportId, 'Investigation instruction', message);
    return { message: 'Instruction sent to the assigned volunteer.' };
  }

  async getMessages(userId: string, reportId: string) {
    await this.getOwnedReport(userId, reportId);
    return this.messageRepo.find({ where: { reportId, caseOfficerId: userId }, order: { createdAt: 'DESC' } });
  }

  async sendMessage(userId: string, reportId: string, dto: CaseOfficerMessageDto) {
    const report = await this.getOwnedReport(userId, reportId);
    const saved = await this.messageRepo.save(this.messageRepo.create({
      reportId,
      reporterId: report.reporterId,
      caseOfficerId: userId,
      message: dto.message,
    }));
    await this.notify(report.reporterId, reportId, 'New message from Case Officer', dto.message);
    return saved;
  }

  async getNotifications(userId: string) {
    await this.getOfficer(userId);
    return this.notificationRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async markNotificationRead(userId: string, notificationId: string) {
    await this.getOfficer(userId);
    const notification = await this.notificationRepo.findOne({ where: { id: notificationId, userId } });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.isRead = true;
    return this.notificationRepo.save(notification);
  }

  async markAllNotificationsRead(userId: string) {
    await this.getOfficer(userId);
    await this.notificationRepo.update({ userId, isRead: false }, { isRead: true });
    return { message: 'All notifications marked as read.' };
  }

  async getProfile(userId: string) {
    return this.publicUser(await this.getOfficer(userId));
  }

  async updateProfile(userId: string, dto: UpdateCaseOfficerProfileDto) {
    const officer = await this.getOfficer(userId);
    Object.assign(officer, dto);
    return this.publicUser(await this.userRepo.save(officer));
  }

  async changePassword(userId: string, dto: ChangeCaseOfficerPasswordDto) {
    const officer = await this.getOfficer(userId);
    if (!(await bcrypt.compare(dto.currentPassword, officer.password))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    officer.password = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepo.save(officer);
    return { message: 'Password changed successfully.' };
  }

  private async getOfficer(userId: string) {
    const officer = await this.userRepo.findOne({
      where: { id: userId, role: UserRole.CASE_OFFICER },
    });
    if (!officer) throw new ForbiddenException('Case Officer account not found');
    if (!officer.isActive) throw new ForbiddenException('Case Officer account is inactive');
    return officer;
  }

  private async getAccessibleReport(userId: string, reportId: string) {
    await this.getOfficer(userId);
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
      relations: { reporter: true, caseOfficer: true },
    });
    if (!report) throw new NotFoundException('Report not found');
    if (report.caseOfficerId && report.caseOfficerId !== userId) {
      throw new ForbiddenException('You cannot access this report');
    }
    if (!report.caseOfficerId && report.status !== ReportStatus.PENDING) {
      throw new ForbiddenException('You cannot access this report');
    }
    return report;
  }

  private async getOwnedReport(userId: string, reportId: string) {
    await this.getOfficer(userId);
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
      relations: { reporter: true, caseOfficer: true },
    });
    if (!report) throw new NotFoundException('Report not found');
    if (report.caseOfficerId && report.caseOfficerId !== userId) {
      throw new ForbiddenException('You cannot modify this report');
    }
    if (!report.caseOfficerId && report.status !== ReportStatus.PENDING) {
      throw new ForbiddenException('You cannot modify this report');
    }
    return report;
  }

  private async getOwnedAssignment(userId: string, assignmentId: string) {
    await this.getOfficer(userId);
    const assignment = await this.assignmentRepo.findOne({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Volunteer request not found');
    const report = await this.reportRepo.findOne({ where: { id: assignment.reportId, caseOfficerId: userId } });
    if (!report) throw new ForbiddenException('You cannot modify this volunteer assignment');
    return assignment;
  }

  private async notify(userId: string, reportId: string, title: string, message: string) {
    await this.notificationRepo.save(this.notificationRepo.create({ userId, reportId, title, message }));
  }

  private safeReport(report: MissingPersonReport) {
    return {
      ...report,
      reporter: report.reporter ? this.publicUser(report.reporter) : undefined,
      caseOfficer: report.caseOfficer ? this.publicUser(report.caseOfficer) : undefined,
    };
  }

  private publicUser(user: User) {
    const { password, ...safeUser } = user;
    return safeUser;
  }
}
