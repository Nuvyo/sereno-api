import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import { BcryptService } from './bcrypt.service';

const originalEnv = { ...process.env };

function getCostFactorFromHash(hash: string): number {
  const parts = hash.split('$');

  return parseInt(parts[2], 10);
}

describe('BcryptService', () => {
  beforeEach(() => {
    process.env.PEPPER = 'test-pepper-value-for-unit-tests';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('uses 4 rounds (cost factor 4) when NODE_ENV=test', async () => {
    process.env.NODE_ENV = 'test';

    const svc = new BcryptService();
    const hash = await svc.hash('value');

    assert.match(hash, /^\$2[aby]?\$\d{2}\$/);
    assert.equal(getCostFactorFromHash(hash), 4);
    assert.equal(await svc.compare('value', hash), true);
    assert.equal(await svc.compare('wrong', hash), false);
  });

  it('uses 12 rounds (cost factor 12) when NODE_ENV!=test', async () => {
    process.env.NODE_ENV = 'production';

    const svc = new BcryptService();
    const hash = await svc.hash('value');

    assert.equal(getCostFactorFromHash(hash), 12);
  });

  it('pepper is applied: same value hashed and compared must match', async () => {
    process.env.NODE_ENV = 'test';

    const svc = new BcryptService();
    const hash = await svc.hash('value');
    const ok = await svc.compare('value', hash);

    assert.equal(ok, true);
  });

  it('pepper is applied: different pepper must not match', async () => {
    process.env.NODE_ENV = 'test';

    const svc = new BcryptService();
    const hash = await svc.hash('value');

    process.env.PEPPER = 'other-pepper-value-completely-diff';

    const svc2 = new BcryptService();
    const ok = await svc2.compare('value', hash);

    assert.equal(ok, false);
  });
});
