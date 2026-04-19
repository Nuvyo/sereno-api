import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { DataSource } from 'typeorm';
import { EmailLog } from '../entities/email-log.entity';

export interface ISendMailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
  userId?: string;
}

@Injectable()
export class MailService {

  constructor(
    private readonly mailerService: MailerService,
    private readonly dataSource: DataSource,
  ) {}

  async send(options: ISendMailOptions): Promise<void> {
    const log = new EmailLog();

    log.to = options.to;
    log.subject = options.subject;
    log.template = options.template;
    log.userId = options.userId ?? null;
    log.error = null;

    try {
      await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        template: options.template,
        context: options.context,
      });
      log.status = 'sent';
    } catch (error) {
      log.status = 'failed';
      log.error = error instanceof Error ? error.message : String(error);
      throw error;
    } finally {
      await this.dataSource.getRepository(EmailLog).save(log).catch(() => {});
    }
  }

}
