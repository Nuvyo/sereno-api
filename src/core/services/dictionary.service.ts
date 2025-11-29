import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { getRequestContext } from '../request-context';

@Injectable()
export class DictionaryService {

  private cache: Record<string, any> | null = null;

  constructor(private readonly i18nService: I18nService) {}

  private ensureCache(): void {
    if (!this.cache) {
      const authEn = require('../../i18n/en/auth.json');
      const authPt = require('../../i18n/ptbr/auth.json');
      const userEn = require('../../i18n/en/user.json');
      const userPt = require('../../i18n/ptbr/user.json');

      this.cache = { auth: { en: authEn, 'ptbr': authPt }, user: { en: userEn, 'ptbr': userPt } };
    }
  }

  public translate(key: string, args?: Record<string, any>, lang: string = 'en'): string {
    this.ensureCache();
    const [domain, ...restParts] = key.split('.');
    const innerKey = restParts.join('.');
    const bundle = (this.cache as any)[domain];
    const ctx = getRequestContext();
    const langToUse = ctx?.language || lang;
    let text: string | undefined = bundle?.[langToUse]?.[innerKey];

    if (typeof text !== 'string' || text.length === 0) {
      try {
        const maybe = this.i18nService.translate(key, { lang: langToUse, args: args || {} }) as unknown as string;

        if (typeof maybe === 'string' && maybe !== key) {
          text = maybe;
        }
      } catch {
        // ignore and fallback below
      }
    }

    if (typeof text !== 'string' || text.length === 0) {
      text = key;
    }

    if (args) {
      for (const [k, v] of Object.entries(args)) {
        const token = `{{${k}}}`;

        text = (text as string).split(token).join(String(v));
      }
    }

    return text as string;
  }

  public isTranslationKey(value?: string): boolean {
    return typeof value === 'string' && (value.startsWith('auth.') || value.startsWith('user.'));
  }

  public isTranslationObject(value?: Record<string, any>): boolean {
    return typeof value === 'object' && this.isTranslationKey(value.key);
  }

}
