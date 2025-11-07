import { Controller, Get } from '@nestjs/common';
import { ServerStatusDTO } from './app.dto';
import { AppService } from './app.service';

@Controller()
export class AppController {

  constructor(private readonly appService: AppService) {}

  @Get()
  public getStatus(): Promise<ServerStatusDTO> {
    return this.appService.getStatus();
  }

}
