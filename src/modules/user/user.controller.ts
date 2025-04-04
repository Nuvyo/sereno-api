import { Controller, Get } from '@nestjs/common';
import { UserService } from '@modules/user/user.service';

@Controller('v1/users')
export class UserController {

  constructor(private readonly userService: UserService) {}

  @Get('/psychologists')
  public getPsychologists() {
    return this.userService.getPsychologists();
  }

}