import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService, ISendMailOptions } from '../../mail/mail.service';
import { EMAIL_JOB_SEND, EMAIL_QUEUE } from '../queue.constants';

@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job<ISendMailOptions>): Promise<void> {
    if (job.name === EMAIL_JOB_SEND) {
      await this.mailService.send(job.data);
    }
  }

}
