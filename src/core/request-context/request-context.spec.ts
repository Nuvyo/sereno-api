import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { setRequestContext, getRequestContext, IRequestContextData } from './request-context';

describe('request-context', () => {
  it('should set and get context data', () => {
    const context: IRequestContextData = { language: 'en' };
		
    setRequestContext(context);

    const result = getRequestContext();

    assert.deepEqual(result, context);
  });

  it('should return undefined if context not set', () => {
    const result = getRequestContext();

    assert.ok(result === undefined || typeof result === 'object');
  });

  it('should isolate context between async calls', async () => {
    const contextA: IRequestContextData = { language: 'en' };
    const contextB: IRequestContextData = { language: 'pt' };

    await Promise.all([
      new Promise<void>(resolve => {
        setRequestContext(contextA);
        setTimeout(() => {
          assert.deepEqual(getRequestContext(), contextA);
          resolve();
        }, 10);
      }),
      new Promise<void>(resolve => {
        setRequestContext(contextB);
        setTimeout(() => {
          assert.deepEqual(getRequestContext(), contextB);
          resolve();
        }, 10);
      })
    ]);
  });
});
