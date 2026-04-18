import * as assert from 'node:assert/strict';
import { describe, before, it, after, afterEach } from 'node:test';
import { INestApplication } from '@nestjs/common';
import { closeApp, createApp } from '../../../test/setup';
import { AuditLogService } from './audit-log.service';
import { AuditAction, AuditLog } from '../entities/audit-log.entity';
import { DataSource } from 'typeorm';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
const DELAY_MS = 100;

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, DELAY_MS));

describe('AuditLogService', () => {
  let app: INestApplication;
  let service: AuditLogService;
  let dataSource: DataSource;

  before(async () => {
    app = await createApp();
    service = app.get(AuditLogService, { strict: false });
    dataSource = app.get(DataSource, { strict: false });

    await dataSource.query('DELETE FROM audit_logs');
  });

  afterEach(async () => {
    await dataSource.query('DELETE FROM audit_logs');
  });

  after(async () => {
    await closeApp(app);
  });

  it('should save an entry with all fields', async () => {
    service.log({
      userId: TEST_USER_ID,
      action: AuditAction.SIGNIN,
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    });

    await flush();

    const entry = await dataSource.getRepository(AuditLog).findOneByOrFail({
      action: AuditAction.SIGNIN,
      ip: '192.168.1.1',
    });

    assert.equal(entry.userId, TEST_USER_ID);
    assert.equal(entry.action, AuditAction.SIGNIN);
    assert.equal(entry.ip, '192.168.1.1');
    assert.equal(entry.userAgent, 'Mozilla/5.0');
    assert.ok(entry.createdAt instanceof Date);
  });

  it('should save an entry without userId for failed signin', async () => {
    service.log({ action: AuditAction.SIGNIN_FAILED, ip: '10.0.0.1', userAgent: 'curl/7.0' });

    await flush();

    const entry = await dataSource.getRepository(AuditLog).findOneByOrFail({
      action: AuditAction.SIGNIN_FAILED,
      ip: '10.0.0.1',
    });

    assert.equal(entry.userId, null);
    assert.equal(entry.action, AuditAction.SIGNIN_FAILED);
    assert.equal(entry.ip, '10.0.0.1');
    assert.equal(entry.userAgent, 'curl/7.0');
  });

  it('should save an entry without ip and userAgent', async () => {
    service.log({ userId: TEST_USER_ID, action: AuditAction.SIGNOUT });

    await flush();

    const entry = await dataSource.getRepository(AuditLog).findOneByOrFail({
      action: AuditAction.SIGNOUT,
      userId: TEST_USER_ID,
    });

    assert.equal(entry.ip, null);
    assert.equal(entry.userAgent, null);
  });

  it('should save entries for all action types', async () => {
    const actions = Object.values(AuditAction);

    for (const action of actions) {
      service.log({ userId: TEST_USER_ID, action });
    }

    await flush();

    const count = await dataSource.getRepository(AuditLog).count();

    assert.equal(count, actions.length);
  });

  it('should not throw when save fails due to invalid data', async () => {
    const originalError = console.error;
    let capturedError: unknown;

    console.error = (err: unknown) => { capturedError = err; };

    assert.doesNotThrow(() => {
      service.log({ userId: 'not-a-valid-uuid', action: AuditAction.SIGNIN });
    });

    await flush();

    console.error = originalError;

    assert.ok(capturedError, 'expected console.error to be called with the DB error');
  });
});
