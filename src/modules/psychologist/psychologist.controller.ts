import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { PsychologistService } from './psychologist.service';
import { QueryData, QueryPipe } from '../../core/pipes/query.pipe';

@Controller('v1/psychologists')
export class PsychologistController {

  constructor(private readonly psychologistService: PsychologistService) {}

  @Get()
  public getPsychologists(@Query(new QueryPipe()) query: QueryData) {
    return this.psychologistService.findAll(query);
  }

  @Get('/:id')
  public getPsychologistById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.psychologistService.findOne(id);
  }

}
