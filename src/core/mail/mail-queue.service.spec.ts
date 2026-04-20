import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { Queue } from 'bullmq';
import { MailQueueService } from './mail-queue.service';
import { JobService } from '../queue/job.service';
import { ISendMailOptions } from './mail.service';
import { EMAIL_JOB_SEND } from '../queue/queue.constants';

function mockQueue(): Queue<ISendMailOptions> {
  return {} as unknown as Queue<ISendMailOptions>;
}

function mockJobService(overrides: Record<string, any> = {}): JobService {
  return {
    add: async () => {},
    ...overrides,
  } as unknown as JobService;
}

function makeMailOptions(partial: Partial<ISendMailOptions> = {}): ISendMailOptions {
  return {
    to: 'user@example.com',
    subject: 'Test Subject',
    template: 'welcome',
    context: { name: 'Alice' },
    ...partial,
  };
}

describe('MailQueueService', () => {

  describe('send', () => {

    it('should call jobService.add with the email queue and send job name', async () => {
      const captured: any[] = [];
      const queue = mockQueue();
      const service = new MailQueueService(
        queue,
        mockJobService({ add: async (q: any, name: string, data: any) => { captured.push({ q, name, data }); } }),
      );

      await service.send(makeMailOptions());

      assert.equal(captured.length, 1);
      assert.strictEqual(captured[0].q, queue);
      assert.equal(captured[0].name, EMAIL_JOB_SEND);
    });

    it('should forward the mail options as job data', async () => {
      const captured: any[] = [];
      const service = new MailQueueService(
        mockQueue(),
        mockJobService({ add: async (_q: any, _name: string, data: any) => { captured.push(data); } }),
      );
      const options = makeMailOptions({ to: 'bob@example.com', subject: 'Hello Bob' });

      await service.send(options);

      assert.deepEqual(captured[0], options);
    });

    it('should forward options with userId when present', async () => {
      const captured: any[] = [];
      const service = new MailQueueService(
        mockQueue(),
        mockJobService({ add: async (_q: any, _name: string, data: any) => { captured.push(data); } }),
      );
      const options = makeMailOptions({ userId: 'user-id-42' });

      await service.send(options);

      assert.equal(captured[0].userId, 'user-id-42');
    });

    it('should reject when jobService.add throws', async () => {
      const service = new MailQueueService(
        mockQueue(),
        mockJobService({ add: async () => { throw new Error('queue unavailable'); } }),
      );

      await assert.rejects(
        () => service.send(makeMailOptions()),
        (err: unknown) => {
          assert.ok(err instanceof Error);
          assert.equal((err as Error).message, 'queue unavailable');
          return true;
        },
      );
    });

  });

});
