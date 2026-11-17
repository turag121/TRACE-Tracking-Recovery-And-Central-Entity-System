import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EmailService } from '../email/email.service';
import { EmailVerificationPurpose, VerificationRole } from '../entities/email-verification.entity';
import { InvestigationUpdate } from '../entities/investigation-update.entity';
import { MissingPersonReport, ReportStatus } from '../entities/missing-person-report.entity';
import { Notification } from '../entities/notification.entity';
import { User, UserRole } from '../entities/user.entity';
import {
  VolunteerAssignment,
  VolunteerAssignmentStatus,
} from '../entities/volunteer-assignment.entity';
import { VolunteerTip, VolunteerTipStatus } from '../entities/volunteer-tip.entity';
import { ChangeVolunteerPasswordDto } from './dto/change-volunteer-password.dto';
import { SubmitVolunteerTipDto } from './dto/submit-volunteer-tip.dto';
import { UpdateVolunteerAssignmentStatusDto } from './dto/update-volunteer-assignment-status.dto';
import { UpdateVolunteerProfileDto } from './dto/update-volunteer-profile.dto';
import { VolunteerRegistrationDto } from './dto/volunteer-registration.dto';

@Injectable()
export class VolunteerService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(MissingPersonReport) private readonly reportRepo: Repository<MissingPersonReport>,
    @InjectRepository(VolunteerAssignment) private readonly assignmentRepo: Repository<VolunteerAssignment>,
    @InjectRepository(VolunteerTip) private readonly tipRepo: Repository<VolunteerTip>,
    @InjectRepository(InvestigationUpdate) private readonly updateRepo: Repository<InvestigationUpdate>,
    @InjectRepository(Notification) private readonly notificationRepo: Repository<Notification>,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: VolunteerRegistrationDto) {
    const duplicate = await this.userRepo.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    });
    if (duplicate) throw new ConflictException('Username or email already exists');
    const verificationToken = await this.emailService.startRegistration({
      ...dto,
      password: await bcrypt.hash(dto.password, 10),
    }, VerificationRole.VOLUNTEER);
    return {
      message: 'Registration initiated. Please check your email for the OTP.',
      email: dto.email,
      verificationRequired: true,
      verificationToken,
    };
  }

  async completeRegistration(verificationToken: string, otp: string) {
    const record = await this.emailService.verifyRegistrationOtp(
      verificationToken,
      otp,
      VerificationRole.VOLUNTEER,
    );
    if (!record.verificationData) throw new ConflictException('Registration data is missing');
    const duplicate = await this.userRepo.findOne({
      where: [{ username: record.verificationData.username }, { email: record.verificationData.email }],
    });
    if (duplicate) throw new ConflictException('Username or email already exists');
    const user = await this.userRepo.save(this.userRepo.create({
      ...record.verificationData,
      role: UserRole.VOLUNTEER,
      isEmailVerified: true,
      isActive: true,
    }));
    await this.emailService.consumeRegistration(record.id);
    await this.emailService.sendRegistrationConfirmationEmail(user.email);
    return { message: 'Volunteer registration completed successfully.', registrationCompleted: true };
  }

  resendRegistrationOtp(token: string) {
    return this.emailService.resendOtp(token, EmailVerificationPurpose.REGISTRATION);
  }

  async getDashboard(userId: string) {
    await this.getVolunteer(userId);
    const [availableCases, joinedCases, pendingRequests, activeAssignments, completedAssignments,
      totalTips, pendingTips, verifiedTips, recentNotifications] = await Promise.all([
      this.reportRepo.count({ where: { status: ReportStatus.ACTIVE } }),
      this.assignmentRepo.count({
        where: [
          { volunteerId: userId, status: VolunteerAssignmentStatus.PENDING },
          { volunteerId: userId, status: VolunteerAssignmentStatus.ACTIVE },
          { volunteerId: userId, status: VolunteerAssignmentStatus.COMPLETED },
        ],
      }),
      this.assignmentRepo.count({ where: { volunteerId: userId, status: VolunteerAssignmentStatus.PENDING } }),
      this.assignmentRepo.count({ where: { volunteerId: userId, status: VolunteerAssignmentStatus.ACTIVE } }),
      this.assignmentRepo.count({ where: { volunteerId: userId, status: VolunteerAssignmentStatus.COMPLETED } }),
      this.tipRepo.count({ where: { volunteerId: userId } }),
      this.tipRepo.count({ where: { volunteerId: userId, verificationStatus: VolunteerTipStatus.PENDING } }),
      this.tipRepo.count({ where: { volunteerId: userId, verificationStatus: VolunteerTipStatus.VERIFIED } }),
      this.notificationRepo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 10 }),
    ]);
    return {
      totalAvailableCases: availableCases,
      totalCasesJoined: joinedCases,
      pendingParticipationRequests: pendingRequests,
      activeAssignments,
      completedAssignments,
      totalSubmittedTips: totalTips,
      pendingTips,
      verifiedTips,
      recentNotifications,
    };
  }

  async getCases(query: {
    search?: string; district?: string; city?: string; location?: string;
    gender?: string; age?: string; minAge?: string; maxAge?: string; page?: string; limit?: string;
  }) {
    const page = this.parsePositiveInt(query.page, 1);
    const limit = Math.min(this.parsePositiveInt(query.limit, 10), 100);
    const queryBuilder = this.reportRepo.createQueryBuilder('report')
      .where('report.status = :status', { status: ReportStatus.ACTIVE });
    if (query.search) queryBuilder.andWhere('report.personName ILIKE :search', { search: `%${query.search}%` });
    if (query.gender) queryBuilder.andWhere('LOWER(report.gender) = LOWER(:gender)', { gender: query.gender });
    if (query.location || query.district || query.city) {
      const location = query.location || query.district || query.city;
      queryBuilder.andWhere('report.lastSeenLocation ILIKE :location', { location: `%${location}%` });
    }
    const exactAge = query.age ? this.parseAge(query.age) : undefined;
    const minAge = query.minAge ? this.parseAge(query.minAge) : undefined;
    const maxAge = query.maxAge ? this.parseAge(query.maxAge) : undefined;
    if (exactAge !== undefined) queryBuilder.andWhere('report.age = :age', { age: exactAge });
    if (minAge !== undefined) queryBuilder.andWhere('report.age >= :minAge', { minAge });
    if (maxAge !== undefined) queryBuilder.andWhere('report.age <= :maxAge', { maxAge });
    const [reports, total] = await queryBuilder
      .orderBy('report.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data: reports.map((report) => this.publicReport(report)), page, limit, total };
  }

  async getCase(caseId: string) {
    const report = await this.reportRepo.findOne({
      where: { id: caseId, status: ReportStatus.ACTIVE },
      relations: { caseOfficer: true },
    });
    if (!report) throw new NotFoundException('Available case not found');
    const updates = await this.updateRepo.find({
      where: { reportId: caseId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    return { ...this.publicReport(report), investigationUpdates: updates };
  }

  async joinCase(userId: string, caseId: string) {
    await this.getVolunteer(userId);
    const report = await this.reportRepo.findOne({ where: { id: caseId, status: ReportStatus.ACTIVE } });
    if (!report) throw new NotFoundException('Available case not found');
    const existing = await this.assignmentRepo.findOne({
      where: [
        { volunteerId: userId, reportId: caseId, status: VolunteerAssignmentStatus.PENDING },
        { volunteerId: userId, reportId: caseId, status: VolunteerAssignmentStatus.ACTIVE },
      ],
    });
    if (existing) throw new ConflictException('You already have a pending or active request for this case');
    const assignment = await this.assignmentRepo.save(this.assignmentRepo.create({
      volunteerId: userId,
      reportId: caseId,
      status: VolunteerAssignmentStatus.PENDING,
    }));
    if (report.caseOfficerId) {
      await this.notificationRepo.save(this.notificationRepo.create({
        userId: report.caseOfficerId,
        reportId: caseId,
        title: 'Volunteer participation request',
        message: 'A volunteer has requested to join your case.',
      }));
    }
    return assignment;
  }

  getMyCases(userId: string) {
    return this.assignmentRepo.find({
      where: { volunteerId: userId },
      order: { updatedAt: 'DESC' },
    });
  }

  getAssignments(userId: string) {
    return this.getMyCases(userId);
  }

  async getAssignment(userId: string, assignmentId: string) {
    const assignment = await this.getOwnedAssignment(userId, assignmentId);
    const report = await this.reportRepo.findOne({ where: { id: assignment.reportId } });
    return { ...assignment, report: report ? this.publicReport(report) : null };
  }

  async leaveAssignment(userId: string, assignmentId: string) {
    const assignment = await this.getOwnedAssignment(userId, assignmentId);
    if (![VolunteerAssignmentStatus.PENDING, VolunteerAssignmentStatus.ACTIVE].includes(assignment.status)) {
      throw new BadRequestException('Only pending or active assignments can be left');
    }
    assignment.status = VolunteerAssignmentStatus.LEFT;
    return this.assignmentRepo.save(assignment);
  }

  async submitTip(userId: string, caseId: string, dto: SubmitVolunteerTipDto, files: Express.Multer.File[] = []) {
    const report = await this.reportRepo.findOne({ where: { id: caseId, status: ReportStatus.ACTIVE } });
    if (!report) throw new NotFoundException('Available case not found');
    const assignment = await this.assignmentRepo.findOne({
      where: { volunteerId: userId, reportId: caseId, status: VolunteerAssignmentStatus.ACTIVE },
    });
    if (!assignment) throw new ForbiddenException('An active assignment is required to submit a tip');
    const tip = this.tipRepo.create({
      volunteerId: userId,
      reportId: caseId,
      assignmentId: assignment.id,
      sightingLocation: dto.sightingLocation,
      sightingDateTime: new Date(dto.sightingDateTime),
      description: dto.description,
      evidencePaths: files.map((file) => file.path),
      verificationStatus: VolunteerTipStatus.PENDING,
    });
    const saved = await this.tipRepo.save(tip);
    if (report.caseOfficerId) {
      await this.notificationRepo.save(this.notificationRepo.create({
        userId: report.caseOfficerId,
        reportId: caseId,
        title: 'New volunteer tip',
        message: 'A volunteer submitted a new tip for your case.',
      }));
    }
    return saved;
  }

  getMyTips(userId: string) {
    return this.tipRepo.find({ where: { volunteerId: userId }, order: { createdAt: 'DESC' } });
  }

  async getTip(userId: string, tipId: string) {
    const tip = await this.tipRepo.findOne({ where: { id: tipId } });
    if (!tip) throw new NotFoundException('Tip not found');
    if (tip.volunteerId !== userId) throw new ForbiddenException('You cannot access this tip');
    return tip;
  }

  async getCaseUpdates(userId: string, caseId: string) {
    await this.assertCaseAccess(userId, caseId);
    return this.updateRepo.find({ where: { reportId: caseId }, order: { createdAt: 'DESC' } });
  }

  async getAssignmentUpdates(userId: string, assignmentId: string) {
    const assignment = await this.getOwnedAssignment(userId, assignmentId);
    return this.getCaseUpdates(userId, assignment.reportId);
  }

  async updateAssignmentStatus(userId: string, assignmentId: string, dto: UpdateVolunteerAssignmentStatusDto) {
    const assignment = await this.getOwnedAssignment(userId, assignmentId);
    if (![VolunteerAssignmentStatus.ACTIVE, VolunteerAssignmentStatus.COMPLETED].includes(dto.status)) {
      throw new BadRequestException('Volunteers may only mark active assignments as active or completed');
    }
    if (assignment.status !== VolunteerAssignmentStatus.ACTIVE && dto.status !== VolunteerAssignmentStatus.ACTIVE) {
      throw new BadRequestException('Only active assignments can be completed');
    }
    assignment.status = dto.status;
    return this.assignmentRepo.save(assignment);
  }

  getNotifications(userId: string) {
    return this.notificationRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async markNotificationRead(userId: string, notificationId: string) {
    const notification = await this.notificationRepo.findOne({ where: { id: notificationId, userId } });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.isRead = true;
    return this.notificationRepo.save(notification);
  }

  async markAllNotificationsRead(userId: string) {
    await this.notificationRepo.update({ userId, isRead: false }, { isRead: true });
    return { message: 'Notifications marked as read' };
  }

  async getProfile(userId: string) {
    return this.publicUser(await this.getVolunteer(userId));
  }

  async updateProfile(userId: string, dto: UpdateVolunteerProfileDto) {
    const user = await this.getVolunteer(userId);
    Object.assign(user, dto);
    return this.publicUser(await this.userRepo.save(user));
  }

  async changePassword(userId: string, dto: ChangeVolunteerPasswordDto) {
    const user = await this.getVolunteer(userId);
    if (!(await bcrypt.compare(dto.currentPassword, user.password))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepo.save(user);
    return { message: 'Password changed successfully' };
  }

  async getParticipationHistory(userId: string) {
    return this.assignmentRepo.find({
      where: { volunteerId: userId, status: In([VolunteerAssignmentStatus.COMPLETED, VolunteerAssignmentStatus.LEFT, VolunteerAssignmentStatus.REJECTED]) },
      order: { updatedAt: 'DESC' },
    });
  }

  private async getVolunteer(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId, role: UserRole.VOLUNTEER } });
    if (!user) throw new ForbiddenException('Volunteer account not found');
    return user;
  }

  private async getOwnedAssignment(userId: string, assignmentId: string) {
    const assignment = await this.assignmentRepo.findOne({ where: { id: assignmentId, volunteerId: userId } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }

  private async assertCaseAccess(userId: string, caseId: string) {
    const assignment = await this.assignmentRepo.findOne({
      where: [
        { volunteerId: userId, reportId: caseId, status: VolunteerAssignmentStatus.PENDING },
        { volunteerId: userId, reportId: caseId, status: VolunteerAssignmentStatus.ACTIVE },
        { volunteerId: userId, reportId: caseId, status: VolunteerAssignmentStatus.COMPLETED },
      ],
    });
    if (!assignment) throw new ForbiddenException('You are not assigned to this case');
  }

  private publicReport(report: MissingPersonReport) {
    return {
      id: report.id,
      personName: report.personName,
      description: report.description,
      age: report.age,
      gender: report.gender,
      physicalDescription: report.physicalDescription,
      photographPath: report.photographPath,
      lastSeenLocation: report.lastSeenLocation,
      lastSeenDate: report.lastSeenDate,
      additionalInformation: report.additionalInformation,
      status: report.status,
      caseOfficer: report.caseOfficer ? {
        id: report.caseOfficer.id,
        name: report.caseOfficer.name,
      } : report.caseOfficerId ? { id: report.caseOfficerId } : null,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };
  }

  private publicUser(user: User) {
    const { password, ...safeUser } = user;
    return safeUser;
  }

  private parsePositiveInt(value: string | undefined, fallback: number) {
    if (value === undefined) return fallback;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) throw new BadRequestException('Pagination values must be positive integers');
    return parsed;
  }

  private parseAge(value: string) {
    const age = Number(value);
    if (!Number.isInteger(age) || age < 0 || age > 150) throw new BadRequestException('Age must be an integer from 0 to 150');
    return age;
  }
}
