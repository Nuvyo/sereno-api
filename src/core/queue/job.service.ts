import { Injectable } from '@nestjs/common';
import { Queue, JobsOptions } from 'bullmq';

const DEFAULT_JOB_OPTS: JobsOptions = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 3000 },
  removeOnComplete: { count: 200, age: 60 * 60 * 24 },
  removeOnFail: { count: 100, age: 60 * 60 * 24 * 7 },
};

@Injectable()
export class JobService {

  async add<T, N extends string>(queue: Queue<T, any, N>, name: N, data: T, opts?: JobsOptions): Promise<void> {
    await (queue as Queue<any, any, any>).add(name, data, { ...DEFAULT_JOB_OPTS, ...opts });
  }

  async schedule<T, N extends string>(queue: Queue<T, any, N>, name: N, data: T, delayMs: number, opts?: JobsOptions): Promise<void> {
    await this.add(queue, name, data, { delay: delayMs, ...opts });
  }

  async addBulk<T, N extends string>(queue: Queue<T, any, N>, jobs: { name: N; data: T; opts?: JobsOptions }[]): Promise<void> {
    await (queue as Queue<any, any, any>).addBulk(
      jobs.map((j) => ({ name: j.name, data: j.data, opts: { ...DEFAULT_JOB_OPTS, ...j.opts } })),
    );
  }

}
