import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CaseOfficerMessage } from '../entities/case-officer-message.entity';
import { FoundPersonReport } from '../entities/found-person-report.entity';
import { InvestigationUpdate } from '../entities/investigation-update.entity';
import { MissingPersonReport, ReportStatus } from '../entities/missing-person-report.entity';
import { Notification } from '../entities/notification.entity';
import { ReportAdditionalInfo } from '../entities/report-additional-info.entity';
import { User, UserRole } from '../entities/user.entity';
import { VolunteerAssignment } from '../entities/volunteer-assignment.entity';
import { EmailVerificationPurpose } from '../entities/email-verification.entity';
import { EmailService } from '../email/email.service';
import { AdditionalInfoDto } from './dto/additional-info.dto';
import { CaseOfficerMessageDto } from './dto/case-officer-message.dto';
import { FoundPersonDto } from './dto/found-person.dto';
import { MprLoginDto } from './dto/mpr-login.dto';
import { MprRegistrationDto } from './dto/mpr-registration.dto';
import { CreateReportDto, UpdateReportDto } from './dto/report.dto';

@Injectable()
export class MprService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(MissingPersonReport) private readonly reportRepo: Repository<MissingPersonReport>,
    @InjectRepository(InvestigationUpdate) private readonly updateRepo: Repository<InvestigationUpdate>,
    @InjectRepository(VolunteerAssignment) private readonly assignmentRepo: Repository<VolunteerAssignment>,
    @InjectRepository(FoundPersonReport) private readonly foundRepo: Repository<FoundPersonReport>,
    @InjectRepository(ReportAdditionalInfo) private readonly infoRepo: Repository<ReportAdditionalInfo>,
    @InjectRepository(CaseOfficerMessage) private readonly messageRepo: Repository<CaseOfficerMessage>,
    @InjectRepository(Notification) private readonly notificationRepo: Repository<Notification>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: MprRegistrationDto) {
    const duplicate = await this.userRepo.findOne({ where: [{ username: dto.username }, { email: dto.email }] });
    if (duplicate) throw new ConflictException('Username or email already exists');

    const user = this.userRepo.create({
      name: dto.name,
      username: dto.username,
      email: dto.email,
      password: await bcrypt.hash(dto.password, 10),
      phone: dto.phone,
      address: dto.address,
      role: UserRole.MPR,
      isActive: false,
      isEmailVerified: false,
    });
    const saved = await this.userRepo.save(user);
    try {
      const verificationToken = await this.emailService.generateAndSendOtp(
        saved.id,
        EmailVerificationPurpose.REGISTRATION,
      );
      return {
        message: 'Registration initiated. Please check your email for the OTP.',
        email: saved.email,
        verificationRequired: true,
        verificationToken,
      };
    } catch (error) {
      await this.userRepo.delete(saved.id);
      throw error;
    }
  }

  async login(dto: MprLoginDto) {
    const user = await this.userRepo.findOne({ where: { username: dto.username, role: UserRole.MPR } });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid MPR credentials');
    }
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in.');
    }
    if (!user.isActive) throw new UnauthorizedException('Your account is inactive');
    return { accessToken: this.jwtService.sign({ sub: user.id, role: user.role, username: user.username }) };
  }

  async getDashboard(userId: string) {
    await this.getMpr(userId);
    const [total, pending, approved, ongoing, found] = await Promise.all([
      this.reportRepo.count({ where: { reporterId: userId } }),
      this.reportRepo.count({ where: { reporterId: userId, status: ReportStatus.PENDING } }),
      this.reportRepo.count({ where: { reporterId: userId, status: ReportStatus.ACTIVE } }),
      this.reportRepo.count({ where: { reporterId: userId, status: ReportStatus.ACTIVE } }),
      this.reportRepo.count({ where: { reporterId: userId, status: ReportStatus.FOUND } }),
    ]);
    const reports = await this.reportRepo.find({ where: { reporterId: userId }, select: { id: true } });
    const recentUpdates = reports.length
      ? await this.updateRepo.find({
          where: { reportId: In(reports.map((report) => report.id)) },
          order: { createdAt: 'DESC' },
          take: 10,
        })
      : [];
    return {
      totalReports: total,
      pendingReports: pending,
      approvedReports: approved,
      ongoingCases: ongoing,
      foundCases: found,
      recentUpdates,
    };
  }

  async createReport(userId: string, dto: CreateReportDto, photographPath: string | null) {
    await this.getMpr(userId);
    const report = this.reportRepo.create({
      ...dto,
      description: dto.physicalDescription,
      reporterId: userId,
      photographPath,
      status: ReportStatus.PENDING,
    });
    return this.safeReport(await this.reportRepo.save(report));
  }

  async getReports(userId: string) {
    await this.getMpr(userId);
    const reports = await this.reportRepo.find({ where: { reporterId: userId }, order: { createdAt: 'DESC' } });
    return reports.map((item) => this.safeReport(item));
  }

  async getReport(userId: string, reportId: string) {
    return this.safeReport(await this.getOwnedReport(userId, reportId));
  }

  async updateReport(userId: string, reportId: string, dto: UpdateReportDto) {
    const report = await this.getOwnedReport(userId, reportId);
    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException('Only pending reports can be edited');
    }
    Object.assign(report, dto);
    if (dto.physicalDescription) report.description = dto.physicalDescription;
    return this.safeReport(await this.reportRepo.save(report));
  }

  async deleteReport(userId: string, reportId: string) {
    const report = await this.getOwnedReport(userId, reportId);
    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException('Only pending reports can be deleted');
    }
    await this.reportRepo.delete(reportId);
    return { message: 'Report deleted successfully' };
  }

  async getProgress(userId: string, reportId: string) {
    const report = await this.getOwnedReport(userId, reportId);
    const updates = await this.updateRepo.find({ where: { reportId }, order: { createdAt: 'DESC' } });
    return { report: this.safeReport(report), updates, lastUpdateDate: updates[0]?.createdAt || report.updatedAt };
  }

  async getCaseOfficer(userId: string, reportId: string) {
    const report = await this.getOwnedReport(userId, reportId);
    if (!report.caseOfficerId) return null;
    const officer = await this.userRepo.findOne({ where: { id: report.caseOfficerId, role: UserRole.CASE_OFFICER } });
    if (!officer) return null;
    return { id: officer.id, name: officer.name, username: officer.username, email: officer.email };
  }

  async getVolunteerAssignments(userId: string, reportId: string) {
    await this.getOwnedReport(userId, reportId);
    return this.assignmentRepo.find({ where: { reportId } });
  }

  async submitFoundPerson(userId: string, reportId: string, dto: FoundPersonDto) {
    const report = await this.getOwnedReport(userId, reportId);
    const foundReport = this.foundRepo.create({
      reportId,
      submittedBy: userId,
      information: dto.information,
      location: dto.location || null,
      foundAt: dto.foundAt ? new Date(dto.foundAt) : null,
    });
    if (report.caseOfficerId) {
      await this.notificationRepo.save(this.notificationRepo.create({
        userId: report.caseOfficerId,
        reportId,
        title: 'Found person report submitted',
        message: 'The reporter submitted information that the missing person may have been found.',
      }));
    }
    return this.foundRepo.save(foundReport);
  }

  async addInformation(userId: string, reportId: string, dto: AdditionalInfoDto) {
    await this.getOwnedReport(userId, reportId);
    return this.infoRepo.save(this.infoRepo.create({ reportId, submittedBy: userId, information: dto.information }));
  }

  async sendMessage(userId: string, reportId: string, dto: CaseOfficerMessageDto) {
    const report = await this.getOwnedReport(userId, reportId);
    if (!report.caseOfficerId) throw new BadRequestException('No case officer is assigned to this report');
    return this.messageRepo.save(this.messageRepo.create({
      reportId,
      reporterId: userId,
      caseOfficerId: report.caseOfficerId,
      message: dto.message,
    }));
  }

  async getNotifications(userId: string) {
    await this.getMpr(userId);
    return this.notificationRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  private async getMpr(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId, role: UserRole.MPR } });
    if (!user) throw new ForbiddenException('MPR account not found');
    if (!user.isActive) throw new ForbiddenException('MPR account is inactive');
    return user;
  }

  private async getOwnedReport(userId: string, reportId: string) {
    await this.getMpr(userId);
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
      relations: { reporter: true, caseOfficer: true },
    });
    if (!report) throw new NotFoundException('Report not found');
    if (report.reporterId !== userId) throw new ForbiddenException('You cannot access this report');
    return report;
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
