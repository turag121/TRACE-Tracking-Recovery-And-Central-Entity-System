import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { CaseOfficerGuard } from '../auth/case-officer.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CaseOfficerService } from './case-officer.service';
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

interface CaseOfficerRequest extends Request {
  user: { sub: string; role: string };
}

@Controller('case-officer')
export class CaseOfficerController {
  constructor(private readonly caseOfficerService: CaseOfficerService) {}

  @Post('auth/login')
  login(@Body() dto: CaseOfficerLoginDto) {
    return this.caseOfficerService.login(dto);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Get('dashboard')
  getDashboard(@Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.getDashboard(request.user.sub);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Get('reports')
  getReports(@Query() filter: ReportFilterDto, @Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.getReports(request.user.sub, filter);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Get('reports/:id')
  getReport(@Param('id') id: string, @Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.getReport(request.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Patch('reports/:id/approve')
  approveReport(@Param('id') id: string, @Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.approveReport(request.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Patch('reports/:id/reject')
  rejectReport(@Param('id') id: string, @Body() dto: RejectReportDto, @Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.rejectReport(request.user.sub, id, dto);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Post('reports/:id/request-information')
  requestInformation(@Param('id') id: string, @Body() dto: RequestReportInformationDto, @Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.requestAdditionalInformation(request.user.sub, id, dto);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Get('reports/:id/additional-information')
  getAdditionalInformation(@Param('id') id: string, @Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.getAdditionalInformation(request.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Get('investigations')
  getInvestigations(@Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.getInvestigations(request.user.sub);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Get('investigations/:id')
  getInvestigation(@Param('id') id: string, @Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.getInvestigation(request.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Patch('investigations/:id/status')
  updateInvestigationStatus(@Param('id') id: string, @Body() dto: UpdateInvestigationStatusDto, @Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.updateInvestigationStatus(request.user.sub, id, dto);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Post('investigations/:id/updates')
  addInvestigationUpdate(@Param('id') id: string, @Body() dto: AddInvestigationUpdateDto, @Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.addInvestigationUpdate(request.user.sub, id, dto);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Get('investigations/:id/updates')
  getInvestigationUpdates(@Param('id') id: string, @Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.getInvestigationUpdates(request.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Post('investigations/:id/found')
  markPersonFound(@Param('id') id: string, @Body() dto: FoundPersonDto, @Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.markPersonFound(request.user.sub, id, dto);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Patch('investigations/:id/close')
  closeInvestigation(@Param('id') id: string, @Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.closeInvestigation(request.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Get('volunteers')
  getVolunteers(@Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.getVolunteers(request.user.sub);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Get('volunteer-requests')
  getVolunteerRequests(@Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.getVolunteerRequests(request.user.sub);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Patch('volunteer-requests/:id/approve')
  approveVolunteerRequest(@Param('id') id: string, @Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.approveVolunteerRequest(request.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Patch('volunteer-requests/:id/reject')
  rejectVolunteerRequest(@Param('id') id: string, @Body() dto: RejectVolunteerRequestDto, @Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.rejectVolunteerRequest(request.user.sub, id, dto);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Post('investigations/:id/volunteers')
  assignVolunteer(@Param('id') id: string, @Body() dto: AssignVolunteerDto, @Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.assignVolunteer(request.user.sub, id, dto);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Get('investigations/:id/volunteers')
  getInvestigationVolunteers(@Param('id') id: string, @Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.getInvestigationVolunteers(request.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Delete('volunteer-assignments/:id')
  removeVolunteerAssignment(@Param('id') id: string, @Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.removeVolunteerAssignment(request.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Get('volunteers/:id/activities')
  getVolunteerActivities(@Param('id') id: string, @Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.getVolunteerActivities(request.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Get('tips')
  getTips(@Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.getTips(request.user.sub);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Patch('tips/:id/review')
  reviewTip(@Param('id') id: string, @Body() dto: ReviewVolunteerTipDto, @Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.reviewTip(request.user.sub, id, dto);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Post('investigations/:investigationId/volunteers/:volunteerId/instruction')
  sendVolunteerInstruction(
    @Param('investigationId') investigationId: string,
    @Param('volunteerId') volunteerId: string,
    @Body() dto: CaseOfficerMessageDto,
    @Req() request: CaseOfficerRequest,
  ) {
    return this.caseOfficerService.sendVolunteerInstruction(request.user.sub, volunteerId, investigationId, dto.message);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Get('reports/:id/messages')
  getMessages(@Param('id') id: string, @Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.getMessages(request.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Post('reports/:id/messages')
  sendMessage(@Param('id') id: string, @Body() dto: CaseOfficerMessageDto, @Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.sendMessage(request.user.sub, id, dto);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Get('notifications')
  getNotifications(@Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.getNotifications(request.user.sub);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Patch('notifications/:id/read')
  markNotificationRead(@Param('id') id: string, @Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.markNotificationRead(request.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Patch('notifications/read-all')
  markAllNotificationsRead(@Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.markAllNotificationsRead(request.user.sub);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Get('profile')
  getProfile(@Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.getProfile(request.user.sub);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Patch('profile')
  updateProfile(@Body() dto: UpdateCaseOfficerProfileDto, @Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.updateProfile(request.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard, CaseOfficerGuard)
  @Patch('change-password')
  changePassword(@Body() dto: ChangeCaseOfficerPasswordDto, @Req() request: CaseOfficerRequest) {
    return this.caseOfficerService.changePassword(request.user.sub, dto);
  }
}
