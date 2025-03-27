import { Controller } from '@nestjs/common';
import { SessionService } from '@modules/session/session.service';

@Controller('v1/sessions')
export class SessionController {

  constructor(private readonly sessionService: SessionService) {}

}