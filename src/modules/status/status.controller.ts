import { Controller, Get } from '@nestjs/common';
import { StatusService } from './status.service';

@Controller('v1/status')
export class StatusController {

  constructor(private readonly statusService: StatusService) {}

  @Get()
  public getStatus() {
    return this.statusService.getStatus();
  }

}
