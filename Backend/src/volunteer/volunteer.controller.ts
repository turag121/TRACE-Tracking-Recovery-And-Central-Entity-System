import { Body, Controller, Post } from '@nestjs/common';
import { VolunteerRegistrationDto } from './dto/volunteer-registration.dto';
import { VerifyVolunteerRegistrationDto } from './dto/verify-volunteer-registration.dto';
import { VolunteerService } from './volunteer.service';

@Controller('volunteer')
export class VolunteerController {
  constructor(private readonly volunteerService: VolunteerService) {}

  @Post('register')
  register(@Body() dto: VolunteerRegistrationDto) {
    return this.volunteerService.register(dto);
  }

  @Post('verify-registration')
  verifyRegistration(@Body() dto: VerifyVolunteerRegistrationDto) {
    return this.volunteerService.completeRegistration(dto.verificationToken, dto.otp);
  }
}
