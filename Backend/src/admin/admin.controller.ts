import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportStatus } from '../entities/missing-person-report.entity';
import { UserRole } from '../entities/user.entity';
import { CreateCaseOfficerDto } from './dto/create-case-officer.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AdminService } from './admin.service';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    role: string;
  };
}

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('auth/login')
  login(@Body() dto: LoginDto) {
    return this.adminService.login(dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('users')
  getUsers(@Query('role') role?: UserRole) {
    return this.adminService.getUsers(role);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('users/role/:role')
  getUsersByRole(@Param('role') role: UserRole) {
    return this.adminService.getUsers(role);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('users/:id/status')
  updateUserStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto, @Req() request: AuthenticatedRequest) {
    return this.adminService.updateUserStatus(id, dto, request.user.sub);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('users/:id')
  deleteUser(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.adminService.deleteUser(id, request.user.sub);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('case-officers')
  createCaseOfficer(@Body() dto: CreateCaseOfficerDto, @Req() request: AuthenticatedRequest) {
    return this.adminService.createCaseOfficer(dto, request.user.sub);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('case-officers')
  getCaseOfficers() {
    return this.adminService.getUsers(UserRole.CASE_OFFICER);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('reports')
  getReports(@Query('status') status?: ReportStatus) {
    return this.adminService.getReports(status);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('reports/:id')
  getReport(@Param('id') id: string) {
    return this.adminService.getReport(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('reports/:id/status')
  updateReportStatus(@Param('id') id: string, @Body() dto: UpdateReportStatusDto, @Req() request: AuthenticatedRequest) {
    return this.adminService.updateReportStatus(id, dto, request.user.sub);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('activities')
  getActivities() {
    return this.adminService.getActivities();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('complaints')
  getComplaints() {
    return this.adminService.getComplaints();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('suspicious-reports')
  getSuspiciousReports() {
    return this.adminService.getSuspiciousReports();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('statistics')
  getStatistics() {
    return this.adminService.getStatistics();
  }
}
