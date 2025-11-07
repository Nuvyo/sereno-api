import * as assert from 'node:assert/strict';
import { describe, before, it, after } from 'node:test';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { createApp, Requester } from '../../../test/utils';
import { StatusModule } from '../status/status.module';

describe('v1/status', () => {
  let app: INestApplication;
  let requester: Requester;

  before(async () => {
    app = await createApp({
      imports: [StatusModule],
    });

    requester = new Requester(app);
  });

  after(async () => {
    await app.close();
  });

  describe('GET /v1/status', () => {
    it('should return the system status successfully', async () => {
      const response = await requester.get('/v1/status');

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(typeof response.body.updatedAt, 'string');
      assert.equal(typeof response.body.dependencies, 'object');
      assert.equal(typeof response.body.dependencies.database, 'object');
      assert.equal(typeof response.body.dependencies.database.version, 'string');
      assert.equal(typeof response.body.dependencies.database.maxConnections, 'number');
      assert.equal(typeof response.body.dependencies.database.openedConnections, 'number');
    });
  });
});
