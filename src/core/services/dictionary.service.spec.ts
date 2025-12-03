import { describe, it, beforeEach } from 'node:test';
import * as assert from 'node:assert/strict';
import { DictionaryService } from './dictionary.service';

const mockI18nServiceFactory = () => {
  let behavior: 'ok' | 'throw' | 'echo' = 'ok';

  return {
    setBehavior(value: 'ok' | 'throw' | 'echo') {
      behavior = value;
    },
    translate(key: string) {
      if (behavior === 'throw') {
        throw new Error('i18n error');
      }

      if (behavior === 'echo') {
        return key;
      }

      if (key === 'auth.dynamic') {
        return 'Hello, {{name}}';
      }

      return '[i18n] ' + key;
    },
  };
};

describe('DictionaryService', () => {
  let i18n: ReturnType<typeof mockI18nServiceFactory>;
  let service: DictionaryService;

  beforeEach(() => {
    i18n = mockI18nServiceFactory();
    service = new DictionaryService(i18n as any);
    service.setLanguage({ headers: { language: 'en' } } as any);
  });

  it('returns cached translation for known key', () => {
    const text = service.translate('auth.signup_successful', undefined);

    assert.equal(text, 'Account created successfully');
  });

  it('falls back to i18nService for unknown key and applies args replacement', () => {
    i18n.setBehavior('ok');

    const text = service.translate('auth.dynamic', { name: 'Tom' });

    assert.equal(text, 'Hello, Tom');
  });

  it('falls back to key when i18nService throws', () => {
    i18n.setBehavior('throw');

    const text = service.translate('auth.unknown_key', undefined);

    assert.equal(text, 'auth.unknown_key');
  });

  it('falls back to key when i18n returns original key', () => {
    i18n.setBehavior('echo');

    const text = service.translate('auth.any_key', undefined);

    assert.equal(text, 'auth.any_key');
  });

  it('detects translation key and object helpers', () => {
    assert.equal(service.isTranslationKey('auth.test'), true);
    assert.equal(service.isTranslationKey('user.test'), true);
    assert.equal(service.isTranslationKey('other.test' as any), false);
    assert.equal(service.isTranslationObject({ key: 'auth.test' }), true);
    assert.equal(service.isTranslationObject({ key: 'other.test' }), false);
  });
});
