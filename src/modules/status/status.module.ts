import { Module } from '@nestjs/common';
import { StatusController } from '@modules/status/status.controller';
import { StatusService } from '@modules/status/status.service';

@Module({
  imports: [],
  controllers: [StatusController],
  providers: [StatusService],
  exports: [StatusService],
})
export class StatusModule {}
