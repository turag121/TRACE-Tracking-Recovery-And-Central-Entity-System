import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VolunteerGuard } from '../auth/volunteer.guard';
import { ChangeVolunteerPasswordDto } from './dto/change-volunteer-password.dto';
import { SubmitVolunteerTipDto } from './dto/submit-volunteer-tip.dto';
import { UpdateVolunteerAssignmentStatusDto } from './dto/update-volunteer-assignment-status.dto';
import { UpdateVolunteerProfileDto } from './dto/update-volunteer-profile.dto';
import { VolunteerLoginDto } from './dto/volunteer-login.dto';
import { VerifyVolunteerRegistrationDto } from './dto/verify-volunteer-registration.dto';
import { VolunteerRegistrationDto } from './dto/volunteer-registration.dto';
import { VolunteerService } from './volunteer.service';

interface VolunteerRequest extends Request {
  user: { sub: string; role: string };
}

@Controller('volunteer')
export class VolunteerController {
  constructor(private readonly volunteerService: VolunteerService) {}

  @Post('register')
  register(@Body() dto: VolunteerRegistrationDto) {
    return this.volunteerService.register(dto);
  }

  @Post('login')
  login(@Body() dto: VolunteerLoginDto) {
    return this.volunteerService.login(dto);
  }

  @Post('verify-registration')
  verifyRegistration(@Body() dto: VerifyVolunteerRegistrationDto) {
    return this.volunteerService.completeRegistration(dto.verificationToken, dto.otp);
  }

  @Post('resend-registration-otp')
  resendRegistrationOtp(@Body('verificationToken') token: string) {
    if (!token) throw new BadRequestException('verificationToken is required');
    return this.volunteerService.resendRegistrationOtp(token);
  }

  @UseGuards(JwtAuthGuard, VolunteerGuard)
  @Get('dashboard')
  getDashboard(@Req() request: VolunteerRequest) {
    return this.volunteerService.getDashboard(request.user.sub);
  }

  @UseGuards(JwtAuthGuard, VolunteerGuard)
  @Get('cases')
  getCases(@Query() query: {
    search?: string; district?: string; city?: string; location?: string;
    gender?: string; age?: string; minAge?: string; maxAge?: string; page?: string; limit?: string;
  }) {
    return this.volunteerService.getCases(query);
  }

  @UseGuards(JwtAuthGuard, VolunteerGuard)
  @Get('cases/:id')
  getCase(@Param('id') id: string) {
    return this.volunteerService.getCase(id);
  }

  @UseGuards(JwtAuthGuard, VolunteerGuard)
  @Post('cases/:caseId/join')
  joinCase(@Param('caseId') caseId: string, @Req() request: VolunteerRequest) {
    return this.volunteerService.joinCase(request.user.sub, caseId);
  }

  @UseGuards(JwtAuthGuard, VolunteerGuard)
  @Get('my-cases')
  getMyCases(@Req() request: VolunteerRequest) {
    return this.volunteerService.getMyCases(request.user.sub);
  }

  @UseGuards(JwtAuthGuard, VolunteerGuard)
  @Get('assignments')
  getAssignments(@Req() request: VolunteerRequest) {
    return this.volunteerService.getAssignments(request.user.sub);
  }

  @UseGuards(JwtAuthGuard, VolunteerGuard)
  @Get('assignments/:id')
  getAssignment(@Param('id') id: string, @Req() request: VolunteerRequest) {
    return this.volunteerService.getAssignment(request.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, VolunteerGuard)
  @Patch('assignments/:id/leave')
  leaveAssignment(@Param('id') id: string, @Req() request: VolunteerRequest) {
    return this.volunteerService.leaveAssignment(request.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, VolunteerGuard)
  @Patch('assignments/:id/status')
  updateAssignmentStatus(
    @Param('id') id: string,
    @Body() dto: UpdateVolunteerAssignmentStatusDto,
    @Req() request: VolunteerRequest,
  ) {
    return this.volunteerService.updateAssignmentStatus(request.user.sub, id, dto);
  }

  @UseGuards(JwtAuthGuard, VolunteerGuard)
  @Get('cases/:caseId/updates')
  getCaseUpdates(@Param('caseId') caseId: string, @Req() request: VolunteerRequest) {
    return this.volunteerService.getCaseUpdates(request.user.sub, caseId);
  }

  @UseGuards(JwtAuthGuard, VolunteerGuard)
  @Get('assignments/:id/updates')
  getAssignmentUpdates(@Param('id') id: string, @Req() request: VolunteerRequest) {
    return this.volunteerService.getAssignmentUpdates(request.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, VolunteerGuard)
  @Post('cases/:caseId/tips')
  @UseInterceptors(FilesInterceptor('evidence', 5, {
    storage: diskStorage({
      destination: (_request, _file, callback) => {
        const directory = join(process.cwd(), 'uploads', 'volunteer-tips');
        mkdirSync(directory, { recursive: true });
        callback(null, directory);
      },
      filename: (_request, file, callback) => {
        callback(null, `${Date.now()}-${Math.round(Math.random() * 1_000_000)}${extname(file.originalname).toLowerCase()}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: 5 },
    fileFilter: (_request, file, callback) => {
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/webp',
        'application/pdf', 'text/plain',
      ];
      if (!allowedTypes.includes(file.mimetype)) {
        callback(new BadRequestException('Only JPEG, PNG, WebP, PDF, and text files are allowed'), false);
        return;
      }
      callback(null, true);
    },
  }))
  submitTip(
    @Param('caseId') caseId: string,
    @Body() dto: SubmitVolunteerTipDto,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @Req() request: VolunteerRequest,
  ) {
    return this.volunteerService.submitTip(request.user.sub, caseId, dto, files || []);
  }

  @UseGuards(JwtAuthGuard, VolunteerGuard)
  @Get('my-tips')
  getMyTips(@Req() request: VolunteerRequest) {
    return this.volunteerService.getMyTips(request.user.sub);
  }

  @UseGuards(JwtAuthGuard, VolunteerGuard)
  @Get('tips/:id')
  getTip(@Param('id') id: string, @Req() request: VolunteerRequest) {
    return this.volunteerService.getTip(request.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, VolunteerGuard)
  @Get('notifications')
  getNotifications(@Req() request: VolunteerRequest) {
    return this.volunteerService.getNotifications(request.user.sub);
  }

  @UseGuards(JwtAuthGuard, VolunteerGuard)
  @Patch('notifications/:id/read')
  markNotificationRead(@Param('id') id: string, @Req() request: VolunteerRequest) {
    return this.volunteerService.markNotificationRead(request.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, VolunteerGuard)
  @Patch('notifications/read-all')
  markAllNotificationsRead(@Req() request: VolunteerRequest) {
    return this.volunteerService.markAllNotificationsRead(request.user.sub);
  }

  @UseGuards(JwtAuthGuard, VolunteerGuard)
  @Get('profile')
  getProfile(@Req() request: VolunteerRequest) {
    return this.volunteerService.getProfile(request.user.sub);
  }

  @UseGuards(JwtAuthGuard, VolunteerGuard)
  @Patch('profile')
  updateProfile(@Body() dto: UpdateVolunteerProfileDto, @Req() request: VolunteerRequest) {
    return this.volunteerService.updateProfile(request.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard, VolunteerGuard)
  @Patch('change-password')
  changePassword(@Body() dto: ChangeVolunteerPasswordDto, @Req() request: VolunteerRequest) {
    return this.volunteerService.changePassword(request.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard, VolunteerGuard)
  @Get('participation-history')
  getParticipationHistory(@Req() request: VolunteerRequest) {
    return this.volunteerService.getParticipationHistory(request.user.sub);
  }
}
