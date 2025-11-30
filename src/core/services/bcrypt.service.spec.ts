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
    process.env.PEPPER = 'pep';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('uses 1 round when NODE_ENV=test', async () => {
    process.env.NODE_ENV = 'test';

    const svc = new BcryptService();
    const hash = await svc.hash('value');

    assert.match(hash, /^\$2[aby]?\$\d{2}\$/);
    assert.equal(getCostFactorFromHash(hash), 4);
    assert.equal(await svc.compare('value', hash), true);
    assert.equal(await svc.compare('wrong', hash), false);
  });

  it('uses 10 rounds when NODE_ENV!=test', async () => {
    process.env.NODE_ENV = 'production';

    const svc = new BcryptService();
    const hash = await svc.hash('value');

    assert.equal(getCostFactorFromHash(hash), 10);
  });

  it('pepper is applied on compare', async () => {
    process.env.NODE_ENV = 'test';
    const svc = new BcryptService();
    const hash = await svc.hash('value');    const ok = await svc.compare('value', hash);

    assert.equal(ok, true);
  });
});
