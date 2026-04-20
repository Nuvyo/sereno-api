import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { Queue, JobsOptions } from 'bullmq';
import { JobService } from './job.service';

function mockQueue(overrides: Record<string, any> = {}): Queue {
  return {
    add: async () => {},
    addBulk: async () => [],
    ...overrides,
  } as unknown as Queue;
}

describe('JobService', () => {

  describe('add', () => {

    it('should call queue.add with the job name and data', async () => {
      const captured: any[] = [];
      const queue = mockQueue({ add: async (name: string, data: any, opts: any) => { captured.push({ name, data, opts }); } });
      const service = new JobService();

      await service.add(queue, 'my-job', { foo: 'bar' });

      assert.equal(captured.length, 1);
      assert.equal(captured[0].name, 'my-job');
      assert.deepEqual(captured[0].data, { foo: 'bar' });
    });

    it('should apply default job options', async () => {
      const captured: any[] = [];
      const queue = mockQueue({ add: async (name: string, data: any, opts: any) => { captured.push(opts); } });
      const service = new JobService();

      await service.add(queue, 'my-job', {});

      assert.equal(captured[0].attempts, 5);
      assert.deepEqual(captured[0].backoff, { type: 'exponential', delay: 3000 });
      assert.ok(captured[0].removeOnComplete);
      assert.ok(captured[0].removeOnFail);
    });

    it('should merge custom options over defaults', async () => {
      const captured: any[] = [];
      const queue = mockQueue({ add: async (name: string, data: any, opts: any) => { captured.push(opts); } });
      const service = new JobService();
      const custom: JobsOptions = { attempts: 10, priority: 1 };

      await service.add(queue, 'my-job', {}, custom);

      assert.equal(captured[0].attempts, 10);
      assert.equal(captured[0].priority, 1);
      assert.deepEqual(captured[0].backoff, { type: 'exponential', delay: 3000 });
    });

    it('should not mutate the default options when custom opts are given', async () => {
      const captured: any[] = [];
      const queue = mockQueue({ add: async (_n: string, _d: any, opts: any) => { captured.push(opts); } });
      const service = new JobService();

      await service.add(queue, 'job-a', {}, { attempts: 99 });
      await service.add(queue, 'job-b', {});

      assert.equal(captured[1].attempts, 5);
    });

  });

  describe('schedule', () => {

    it('should call add with the delay option set', async () => {
      const captured: any[] = [];
      const queue = mockQueue({ add: async (_n: string, _d: any, opts: any) => { captured.push(opts); } });
      const service = new JobService();

      await service.schedule(queue, 'my-job', { value: 1 }, 5000);

      assert.equal(captured[0].delay, 5000);
    });

    it('should merge extra options alongside the delay', async () => {
      const captured: any[] = [];
      const queue = mockQueue({ add: async (_n: string, _d: any, opts: any) => { captured.push(opts); } });
      const service = new JobService();

      await service.schedule(queue, 'my-job', {}, 2000, { attempts: 3 });

      assert.equal(captured[0].delay, 2000);
      assert.equal(captured[0].attempts, 3);
    });

    it('should pass the correct name and data', async () => {
      const captured: any[] = [];
      const queue = mockQueue({ add: async (name: string, data: any) => { captured.push({ name, data }); } });
      const service = new JobService();

      await service.schedule(queue, 'delayed-job', { payload: 42 }, 1000);

      assert.equal(captured[0].name, 'delayed-job');
      assert.deepEqual(captured[0].data, { payload: 42 });
    });

  });

  describe('addBulk', () => {

    it('should call queue.addBulk with mapped jobs', async () => {
      const captured: any[] = [];
      const queue = mockQueue({ addBulk: async (jobs: any[]) => { captured.push(...jobs); return []; } });
      const service = new JobService();

      await service.addBulk(queue, [
        { name: 'job-1', data: { a: 1 } },
        { name: 'job-2', data: { b: 2 } },
      ]);

      assert.equal(captured.length, 2);
      assert.equal(captured[0].name, 'job-1');
      assert.deepEqual(captured[0].data, { a: 1 });
      assert.equal(captured[1].name, 'job-2');
      assert.deepEqual(captured[1].data, { b: 2 });
    });

    it('should apply default options to each job', async () => {
      const captured: any[] = [];
      const queue = mockQueue({ addBulk: async (jobs: any[]) => { captured.push(...jobs); return []; } });
      const service = new JobService();

      await service.addBulk(queue, [{ name: 'job-1', data: {} }]);

      assert.equal(captured[0].opts.attempts, 5);
      assert.deepEqual(captured[0].opts.backoff, { type: 'exponential', delay: 3000 });
    });

    it('should merge per-job options over defaults', async () => {
      const captured: any[] = [];
      const queue = mockQueue({ addBulk: async (jobs: any[]) => { captured.push(...jobs); return []; } });
      const service = new JobService();

      await service.addBulk(queue, [{ name: 'job-1', data: {}, opts: { attempts: 1 } }]);

      assert.equal(captured[0].opts.attempts, 1);
      assert.deepEqual(captured[0].opts.backoff, { type: 'exponential', delay: 3000 });
    });

    it('should handle an empty jobs array without error', async () => {
      let called = false;
      const queue = mockQueue({ addBulk: async (jobs: any[]) => { called = true; return []; } });
      const service = new JobService();

      await assert.doesNotReject(() => service.addBulk(queue, []));
      assert.ok(called);
    });

  });

});
