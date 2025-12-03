import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { ExceptionMiddleware } from './exception.middleware';
import { TypeORMError } from 'typeorm';

function createHostStub() {
  let statusCode: number | undefined;
  let jsonBody: any;
  const response = {
    status(code: number) {
      statusCode = code;

      return this;
    },
    json(payload: any) {
      jsonBody = payload;

      return this as any;
    },
  } as any;
  const host: Partial<ArgumentsHost> = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({}),
    }) as any,
  };

  return { host: host as ArgumentsHost, getStatus: () => statusCode, getBody: () => jsonBody };
}

describe('CustomExceptionFilter', () => {
  const dictionary = {
    setLanguage: () => {},
    isTranslationKey: (value?: string) =>
      typeof value === 'string' && (value.startsWith('auth.') || value.startsWith('user.')),
    isTranslationObject: (value?: Record<string, any>) => !!value && typeof (value as any).key === 'string',
    translate: (key: string) => {
      if (key === 'user.not_found') return 'User not found';

      if (key === 'auth.invalid_credentials') return 'Invalid credentials';

      return key;
    },
  } as any;

  it('maps TypeORM EntityNotFoundError for User to translated user.not_found with 404', () => {
    const filter = new ExceptionMiddleware(dictionary);
    const { host, getStatus, getBody } = createHostStub();
    const err = new TypeORMError('Could not find any entity of type "User"');

    (err as any).stack = 'EntityNotFoundError: ...';

    filter.catch(err as any, host);

    assert.equal(getStatus(), HttpStatus.NOT_FOUND);
    assert.deepEqual(getBody(), { statusCode: 404, message: 'User not found' });
  });

  it('uses message from HttpException response object', () => {
    const filter = new ExceptionMiddleware(dictionary);
    const { host, getStatus, getBody } = createHostStub();
    const ex = new HttpException({ message: 'Plain error' }, HttpStatus.BAD_REQUEST);

    filter.catch(ex, host);

    assert.equal(getStatus(), 400);
    assert.deepEqual(getBody(), { statusCode: 400, message: 'Plain error' });
  });

  it('translates HttpException with i18n key object', () => {
    const filter = new ExceptionMiddleware(dictionary);
    const { host, getStatus, getBody } = createHostStub();
    const ex = new HttpException({ key: 'auth.invalid_credentials' }, HttpStatus.UNAUTHORIZED);

    filter.catch(ex, host);

    assert.equal(getStatus(), 401);
    assert.deepEqual(getBody(), { statusCode: 401, message: 'Invalid credentials' });
  });

  it('uses string response from HttpException directly', () => {
    const filter = new ExceptionMiddleware(dictionary);
    const { host, getStatus, getBody } = createHostStub();
    const ex = new HttpException('oops', HttpStatus.BAD_REQUEST);

    filter.catch(ex, host);

    assert.equal(getStatus(), 400);
    assert.deepEqual(getBody(), { statusCode: 400, message: 'oops' });
  });

  it('falls back to exception.message when payload object has no message or key', () => {
    const filter = new ExceptionMiddleware(dictionary);
    const { host, getStatus, getBody } = createHostStub();
    const ex = new HttpException({ other: true }, HttpStatus.BAD_REQUEST);

    filter.catch(ex, host);

    assert.equal(getStatus(), 400);
    assert.ok(typeof getBody().message === 'string' && getBody().message.length > 0);
  });

  it('falls back to exception.message when payload is not object nor string', () => {
    const filter = new ExceptionMiddleware(dictionary);
    const { host, getStatus, getBody } = createHostStub();
    const ex = new HttpException(123 as any, HttpStatus.BAD_REQUEST);

    filter.catch(ex, host);

    assert.equal(getStatus(), 400);
    assert.ok(typeof getBody().message === 'string' && getBody().message.length > 0);
  });
});
