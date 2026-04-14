import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { CookieService, ICookieOptions } from './cookie.service';

describe('CookieService', () => {
  const svc = new CookieService();

  it('serializes simple cookie', () => {
    const options: ICookieOptions = { value: 'abc' };
    const result = svc.serialize(options);

    assert.equal(result, 'token=abc');
  });

  it('serializes cookie with all attributes', () => {
    const options: ICookieOptions = {
      value: 'abc',
      maxAge: 3600,
      path: '/',
      secure: true,
      httpOnly: true,
    };
    const result = svc.serialize(options);

    assert.match(result, /token=abc/);
    assert.match(result, /Path=\//);
    assert.match(result, /Max-Age=3600/);
    assert.match(result, /Secure/);
    assert.match(result, /HttpOnly/);
  });

  it('parses simple cookie string', () => {
    const cookieStr = 'token=abc';
    const parsed = svc.parse(cookieStr);

    assert.deepEqual(parsed, { name: 'token', value: 'abc' });
  });

  it('parses cookie string with all attributes', () => {
    const cookieStr = 'token=abc; Path=/; Max-Age=3600; Secure; HttpOnly';
    const parsed = svc.parse(cookieStr);

    assert.equal(parsed.value, 'abc');
    assert.equal(parsed.path, '/');
    assert.equal(parsed.maxAge, 3600);
    assert.equal(parsed.secure, true);
    assert.equal(parsed.httpOnly, true);
  });

  it('ignores unknown attributes when parsing', () => {
    const cookieStr = 'token=abc; Foo=bar; Path=/';
    const parsed = svc.parse(cookieStr);

    assert.equal(parsed.value, 'abc');
    assert.equal(parsed.path, '/');
    assert.equal(Object.hasOwn(parsed, 'Foo'), false);
  });
});
