import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JobService } from './job.service';
import { EmailProcessor } from './processors/email.processor';
import { EMAIL_QUEUE } from './queue.constants';
import { MailModule } from '../mail/mail.module';
import { MailQueueService } from '../mail/mail-queue.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
          db: Number(process.env.REDIS_DB) || 0,
        },
        defaultJobOptions: {
          removeOnComplete: { count: 200 },
          removeOnFail: { count: 100 },
        },
      }),
    }),
    BullModule.registerQueue({ name: EMAIL_QUEUE }),
    MailModule,
  ],
  providers: [JobService, EmailProcessor, MailQueueService],
  exports: [JobService, MailQueueService, BullModule],
})
export class QueueModule {}
