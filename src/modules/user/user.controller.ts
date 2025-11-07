import { Controller, Get, Param, ParseUUIDPipe, Put, Query, Req, UseGuards } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { QueryData, QueryPipe } from '../../core/pipes/query.pipe';

@Controller('v1/users')
export class UserController {

  constructor(private readonly userService: UserService) {}

  @Get('/psychologists')
  public getPsychologists(@Query(new QueryPipe()) query: QueryData) {
    return this.userService.listPsychologists(query);
  }

  @Get('/psychologists/:id')
  public getPsychologistById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.userService.getPsychologistById(id);
  }

}
