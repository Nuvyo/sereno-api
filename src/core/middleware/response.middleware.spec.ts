import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { ResponseMiddleware } from './response.middleware';
import { of, firstValueFrom } from 'rxjs';
import { ExecutionContext, CallHandler } from '@nestjs/common';

function createContextStub(): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({}),
    }) as any,
  } as any as ExecutionContext;
}

describe('ResponseInterceptor', () => {
  const dictionary = {
    setLanguage: () => {},
    isTranslationKey: (value?: string) =>
      typeof value === 'string' && (value.startsWith('auth.') || value.startsWith('user.')),
    isTranslationObject: (value?: Record<string, any>) => !!value && typeof (value as any).key === 'string',
    translate: (key: string) => {
      if (key === 'auth.signup_successful') return 'Signup successful';

      if (key === 'user.not_found') return 'User not found';

      return key;
    },
  } as any;

  it('translates string message keys', async () => {
    const interceptor = new ResponseMiddleware(dictionary);
    const ctx = createContextStub();
    const next: CallHandler = { handle: () => of({ message: 'auth.signup_successful', ok: true }) } as any;
    const result = await firstValueFrom(interceptor.intercept(ctx, next));

    assert.deepEqual(result, { message: 'Signup successful', ok: true });
  });

  it('translates object message with key/args', async () => {
    const interceptor = new ResponseMiddleware(dictionary);
    const ctx = createContextStub();
    const next: CallHandler = { handle: () => of({ message: { key: 'user.not_found' }, id: 123 }) } as any;
    const result = await firstValueFrom(interceptor.intercept(ctx, next));

    assert.deepEqual(result, { message: 'User not found', id: 123 });
  });

  it('keeps plain message as-is', async () => {
    const interceptor = new ResponseMiddleware(dictionary);
    const ctx = createContextStub();
    const next: CallHandler = { handle: () => of({ message: 'already translated', other: true }) } as any;
    const result = await firstValueFrom(interceptor.intercept(ctx, next));

    assert.deepEqual(result, { message: 'already translated', other: true });
  });

  it('returns data unchanged when message is absent', async () => {
    const interceptor = new ResponseMiddleware(dictionary);
    const ctx = createContextStub();
    const payload = { ok: true, value: 42 };
    const next: CallHandler = { handle: () => of(payload) } as any;
    const result = await firstValueFrom(interceptor.intercept(ctx, next));

    assert.equal(result, payload);
  });
});
