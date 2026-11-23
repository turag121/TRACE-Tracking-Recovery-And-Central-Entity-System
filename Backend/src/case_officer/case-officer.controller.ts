import { Controller } from '@nestjs/common';
import { CaseOfficerService } from './case-officer.service';

@Controller('case-officer')
export class CaseOfficerController {
  constructor(private readonly caseOfficerService: CaseOfficerService) {}
}
