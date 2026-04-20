import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ISendMailOptions } from './mail.service';
import { JobService } from '../queue/job.service';
import { EMAIL_JOB_SEND, EMAIL_QUEUE } from '../queue/queue.constants';

@Injectable()
export class MailQueueService {

  constructor(
    @InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue<ISendMailOptions>,
    private readonly jobService: JobService,
  ) {}

  async send(options: ISendMailOptions): Promise<void> {
    await this.jobService.add(this.emailQueue, EMAIL_JOB_SEND, options);
  }

}
