import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { Request } from 'express';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MprGuard } from '../auth/mpr.guard';
import { AdditionalInfoDto } from './dto/additional-info.dto';
import { CaseOfficerMessageDto } from './dto/case-officer-message.dto';
import { FoundPersonDto } from './dto/found-person.dto';
import { MprLoginDto } from './dto/mpr-login.dto';
import { MprRegistrationDto } from './dto/mpr-registration.dto';
import { CreateReportDto, UpdateReportDto } from './dto/report.dto';
import { MprService } from './mpr.service';

interface MprRequest extends Request {
  user: {
    sub: string;
    role: string;
  };
}

@Controller('mpr')
export class MprController {
  constructor(private readonly mprService: MprService) {}

  @Post('register')
  register(@Body() dto: MprRegistrationDto) {
    return this.mprService.register(dto);
  }

  @Post('login')
  login(@Body() dto: MprLoginDto) {
    return this.mprService.login(dto);
  }

  @UseGuards(JwtAuthGuard, MprGuard)
  @Get('dashboard')
  getDashboard(@Req() request: MprRequest) {
    return this.mprService.getDashboard(request.user.sub);
  }

  @UseGuards(JwtAuthGuard, MprGuard)
  @Post('reports')
  @UseInterceptors(FileInterceptor('photograph', {
    storage: diskStorage({
      destination: (_request, _file, callback) => {
        const directory = join(process.cwd(), 'uploads', 'missing-person');
        mkdirSync(directory, { recursive: true });
        callback(null, directory);
      },
      filename: (_request, file, callback) => {
        const extension = extname(file.originalname).toLowerCase();
        callback(null, `${Date.now()}-${Math.round(Math.random() * 1_000_000)}${extension}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        callback(new BadRequestException('Only JPEG, PNG, and WebP images are allowed'), false);
        return;
      }
      callback(null, true);
    },
  }))
  createReport(
    @Body() dto: CreateReportDto,
    @UploadedFile() photograph: Express.Multer.File | undefined,
    @Req() request: MprRequest,
  ) {
    if (!photograph) throw new BadRequestException('A photograph is required');
    return this.mprService.createReport(request.user.sub, dto, join('uploads', 'missing-person', photograph.filename));
  }

  @UseGuards(JwtAuthGuard, MprGuard)
  @Get('reports')
  getReports(@Req() request: MprRequest) {
    return this.mprService.getReports(request.user.sub);
  }

  @UseGuards(JwtAuthGuard, MprGuard)
  @Get('reports/:id')
  getReport(@Param('id') id: string, @Req() request: MprRequest) {
    return this.mprService.getReport(request.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, MprGuard)
  @Patch('reports/:id')
  updateReport(@Param('id') id: string, @Body() dto: UpdateReportDto, @Req() request: MprRequest) {
    return this.mprService.updateReport(request.user.sub, id, dto);
  }

  @UseGuards(JwtAuthGuard, MprGuard)
  @Delete('reports/:id')
  deleteReport(@Param('id') id: string, @Req() request: MprRequest) {
    return this.mprService.deleteReport(request.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, MprGuard)
  @Get('reports/:id/progress')
  getProgress(@Param('id') id: string, @Req() request: MprRequest) {
    return this.mprService.getProgress(request.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, MprGuard)
  @Get('reports/:id/case-officer')
  getCaseOfficer(@Param('id') id: string, @Req() request: MprRequest) {
    return this.mprService.getCaseOfficer(request.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, MprGuard)
  @Get('reports/:id/volunteers')
  getVolunteerAssignments(@Param('id') id: string, @Req() request: MprRequest) {
    return this.mprService.getVolunteerAssignments(request.user.sub, id);
  }

  @UseGuards(JwtAuthGuard, MprGuard)
  @Post('reports/:id/found')
  submitFoundPerson(@Param('id') id: string, @Body() dto: FoundPersonDto, @Req() request: MprRequest) {
    return this.mprService.submitFoundPerson(request.user.sub, id, dto);
  }

  @UseGuards(JwtAuthGuard, MprGuard)
  @Post('reports/:id/additional-information')
  addInformation(@Param('id') id: string, @Body() dto: AdditionalInfoDto, @Req() request: MprRequest) {
    return this.mprService.addInformation(request.user.sub, id, dto);
  }

  @UseGuards(JwtAuthGuard, MprGuard)
  @Post('reports/:id/messages')
  sendMessage(@Param('id') id: string, @Body() dto: CaseOfficerMessageDto, @Req() request: MprRequest) {
    return this.mprService.sendMessage(request.user.sub, id, dto);
  }

  @UseGuards(JwtAuthGuard, MprGuard)
  @Get('notifications')
  getNotifications(@Req() request: MprRequest) {
    return this.mprService.getNotifications(request.user.sub);
  }
}
