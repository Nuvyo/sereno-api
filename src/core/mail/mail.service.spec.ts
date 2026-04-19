import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { DataSource } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { MailService, ISendMailOptions } from './mail.service';
import { EmailLog } from '../entities/email-log.entity';

// --- Factories ---

function mockMailer(overrides: Record<string, any> = {}): MailerService {
  return {
    sendMail: async () => {},
    ...overrides,
  } as unknown as MailerService;
}

function mockLogRepo(overrides: Record<string, any> = {}) {
  return {
    save: async (entity: any) => entity,
    ...overrides,
  };
}

function mockDataSource(logOverrides: Record<string, any> = {}): DataSource {
  return {
    getRepository: (entity: any) => {
      if (entity === EmailLog) return mockLogRepo(logOverrides);
      return mockLogRepo();
    },
  } as unknown as DataSource;
}

function makeOptions(partial: Partial<ISendMailOptions> = {}): ISendMailOptions {
  return {
    to: 'user@example.com',
    subject: 'Test Subject',
    template: 'test-template',
    context: { greeting: 'Hello' },
    ...partial,
  };
}

// --- Tests ---

describe('MailService', () => {

  describe('send', () => {

    it('should call sendMail with the correct arguments', async () => {
      const captured: any[] = [];
      const service = new MailService(
        mockMailer({ sendMail: async (opts: any) => { captured.push(opts); } }),
        mockDataSource(),
      );
      const options = makeOptions({ userId: 'user-id-1' });

      await service.send(options);

      assert.equal(captured.length, 1);
      assert.equal(captured[0].to, options.to);
      assert.equal(captured[0].subject, options.subject);
      assert.equal(captured[0].template, options.template);
      assert.deepEqual(captured[0].context, options.context);
    });

    it('should save log with status sent and no error on success', async () => {
      const savedLogs: EmailLog[] = [];
      const service = new MailService(
        mockMailer(),
        mockDataSource({ save: async (log: EmailLog) => { savedLogs.push(log); return log; } }),
      );

      await service.send(makeOptions({ userId: 'user-id-1' }));

      assert.equal(savedLogs.length, 1);
      assert.equal(savedLogs[0].status, 'sent');
      assert.equal(savedLogs[0].error, null);
    });

    it('should populate log fields from options', async () => {
      const savedLogs: EmailLog[] = [];
      const service = new MailService(
        mockMailer(),
        mockDataSource({ save: async (log: EmailLog) => { savedLogs.push(log); return log; } }),
      );
      const options = makeOptions({ to: 'alice@example.com', subject: 'Hello', template: 'welcome', userId: 'uid-42' });

      await service.send(options);

      assert.equal(savedLogs[0].to, 'alice@example.com');
      assert.equal(savedLogs[0].subject, 'Hello');
      assert.equal(savedLogs[0].template, 'welcome');
      assert.equal(savedLogs[0].userId, 'uid-42');
    });

    it('should set userId to null when not provided', async () => {
      const savedLogs: EmailLog[] = [];
      const service = new MailService(
        mockMailer(),
        mockDataSource({ save: async (log: EmailLog) => { savedLogs.push(log); return log; } }),
      );

      await service.send(makeOptions());

      assert.equal(savedLogs[0].userId, null);
    });

    it('should save log with status failed and error message when sendMail throws', async () => {
      const savedLogs: EmailLog[] = [];
      const service = new MailService(
        mockMailer({ sendMail: async () => { throw new Error('SMTP connection refused'); } }),
        mockDataSource({ save: async (log: EmailLog) => { savedLogs.push(log); return log; } }),
      );

      await assert.rejects(() => service.send(makeOptions()));

      assert.equal(savedLogs.length, 1);
      assert.equal(savedLogs[0].status, 'failed');
      assert.equal(savedLogs[0].error, 'SMTP connection refused');
    });

    it('should re-throw the original error when sendMail fails', async () => {
      const originalError = new Error('timeout');
      const service = new MailService(
        mockMailer({ sendMail: async () => { throw originalError; } }),
        mockDataSource(),
      );

      await assert.rejects(
        () => service.send(makeOptions()),
        (err: unknown) => {
          assert.strictEqual(err, originalError);
          return true;
        },
      );
    });

    it('should set log error from non-Error throw', async () => {
      const savedLogs: EmailLog[] = [];
      const service = new MailService(
        mockMailer({ sendMail: async () => { throw 'bad gateway'; } }),
        mockDataSource({ save: async (log: EmailLog) => { savedLogs.push(log); return log; } }),
      );

      await assert.rejects(() => service.send(makeOptions()));

      assert.equal(savedLogs[0].error, 'bad gateway');
    });

    it('should not throw when the log save fails', async () => {
      const service = new MailService(
        mockMailer(),
        mockDataSource({ save: async () => { throw new Error('DB unavailable'); } }),
      );

      await assert.doesNotReject(() => service.send(makeOptions()));
    });

    it('should always save the log even when sendMail fails', async () => {
      const savedLogs: EmailLog[] = [];
      const service = new MailService(
        mockMailer({ sendMail: async () => { throw new Error('network error'); } }),
        mockDataSource({ save: async (log: EmailLog) => { savedLogs.push(log); return log; } }),
      );

      await assert.rejects(() => service.send(makeOptions()));

      assert.equal(savedLogs.length, 1);
    });

  });

});
