import { Module } from '@nestjs/common';
import { PsychologistController } from './psychologist.controller';
import { PsychologistService } from './psychologist.service';

@Module({
  imports: [],
  controllers: [PsychologistController],
  providers: [PsychologistService],
  exports: [PsychologistService],
})
export class PsychologistModule {}
