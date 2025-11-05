import { Controller, Get } from '@nestjs/common';
import { ServerStatusDTO } from '@modules/app.dto';
import { AppService } from '@modules/app.service';

@Controller()
export class AppController {

  constructor(private readonly appService: AppService) {}

  @Get()
  public getStatus(): Promise<ServerStatusDTO> {
    return this.appService.getStatus();
  }

}
