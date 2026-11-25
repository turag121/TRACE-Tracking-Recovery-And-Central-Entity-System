import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from '../entities/activity-log.entity';
import { Complaint } from '../entities/complaint.entity';
import { MissingPersonReport, ReportStatus } from '../entities/missing-person-report.entity';
import { SuspiciousReport } from '../entities/suspicious-report.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateCaseOfficerDto } from './dto/create-case-officer.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(MissingPersonReport) private readonly reportRepo: Repository<MissingPersonReport>,
    @InjectRepository(ActivityLog) private readonly activityRepo: Repository<ActivityLog>,
    @InjectRepository(Complaint) private readonly complaintRepo: Repository<Complaint>,
    @InjectRepository(SuspiciousReport) private readonly suspiciousRepo: Repository<SuspiciousReport>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { username: dto.username, role: UserRole.ADMIN } });
    if (!user || !user.isActive || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid admin credentials');
    }
    return { accessToken: this.jwtService.sign({ sub: user.id, role: user.role, username: user.username }) };
  }

  async getDashboard() {
    const [totalUsers, totalReports, activeCases, closedCases, volunteers, caseOfficers, activities] =
      await Promise.all([
        this.userRepo.count(),
        this.reportRepo.count(),
        this.reportRepo.count({ where: { status: ReportStatus.ACTIVE } }),
        this.reportRepo.count({ where: { status: ReportStatus.CLOSED } }),
        this.userRepo.count({ where: { role: UserRole.VOLUNTEER } }),
        this.userRepo.count({ where: { role: UserRole.CASE_OFFICER } }),
        this.getActivities(),
      ]);
    return { totalUsers, totalReports, activeCases, closedCases, volunteers, caseOfficers, recentActivities: activities };
  }

  async getUsers(role?: UserRole) {
    const users = await this.userRepo.find({ where: role ? { role } : undefined, order: { createdAt: 'DESC' } });
    return users.map((user) => this.publicUser(user));
  }

  async getUser(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.publicUser(user);
  }

  async updateUserStatus(id: string, dto: UpdateUserStatusDto, adminId: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.isActive = dto.isActive;
    await this.userRepo.save(user);
    await this.log('ACCOUNT_STATUS_CHANGED', `${user.username} was ${dto.isActive ? 'activated' : 'deactivated'}`, adminId);
    return this.publicUser(user);
  }

  async deleteUser(id: string, adminId: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const reportCount = await this.reportRepo.count({ where: [{ reporterId: id }, { caseOfficerId: id }] });
    if (reportCount > 0) throw new ConflictException('User has related reports and cannot be deleted');
    await this.userRepo.delete(id);
    await this.log('USER_DELETED', `${user.username} was deleted`, adminId);
    return { message: 'User deleted successfully' };
  }

  async createCaseOfficer(dto: CreateCaseOfficerDto, adminId: string) {
    const duplicate = await this.userRepo.findOne({ where: [{ username: dto.username }, { email: dto.email }] });
    if (duplicate) throw new ConflictException('Username or email already exists');
    const user = this.userRepo.create({
      ...dto,
      password: await bcrypt.hash(dto.password, 10),
      role: UserRole.CASE_OFFICER,
      isActive: true,
      isEmailVerified: true,
    });
    const saved = await this.userRepo.save(user);
    await this.log('CASE_OFFICER_CREATED', `${saved.username} was created`, adminId);
    return this.publicUser(saved);
  }

  async getReports(status?: ReportStatus) {
    return this.reportRepo.find({
      where: status ? { status } : undefined,
      relations: { reporter: true, caseOfficer: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getReport(id: string) {
    const report = await this.reportRepo.findOne({ where: { id }, relations: { reporter: true, caseOfficer: true } });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async updateReportStatus(id: string, dto: UpdateReportStatusDto, adminId: string) {
    const report = await this.getReport(id);
    if (report.status === ReportStatus.REJECTED && dto.status !== ReportStatus.REJECTED) {
      throw new BadRequestException('Rejected reports cannot be reopened');
    }
    report.status = dto.status;
    const saved = await this.reportRepo.save(report);
    await this.log('REPORT_STATUS_CHANGED', `Report ${id} changed to ${dto.status}`, adminId);
    return saved;
  }

  async getActivities() {
    return this.activityRepo.find({ order: { createdAt: 'DESC' }, take: 20 });
  }

  async getComplaints() {
    return this.complaintRepo.find({ order: { createdAt: 'DESC' } });
  }

  async getSuspiciousReports() {
    return this.suspiciousRepo.find({ order: { createdAt: 'DESC' } });
  }

  async getStatistics() {
    return {
      users: await this.userRepo.count(),
      reports: await this.reportRepo.count(),
      complaints: await this.complaintRepo.count(),
      suspiciousReports: await this.suspiciousRepo.count(),
    };
  }

  private publicUser(user: User) {
    const { password, ...safeUser } = user;
    return safeUser;
  }

  private async log(action: string, description: string, userId: string) {
    await this.activityRepo.save(this.activityRepo.create({ action, description, userId }));
  }
}
