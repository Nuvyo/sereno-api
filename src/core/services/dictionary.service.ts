import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class DictionaryService {

  private cache: Record<string, any> | null = null;

  constructor(private readonly i18nService: I18nService) {}

  private ensureCache(): void {
    if (!this.cache) {
      // Load JSON dictionaries directly (split per locale)
       
      const authEn = require('../../i18n/en/auth.json');
      const authPt = require('../../i18n/pt-br/auth.json');
      const userEn = require('../../i18n/en/user.json');
      const userPt = require('../../i18n/pt-br/user.json');

      this.cache = { auth: { 'en': authEn, 'pt-br': authPt }, user: { 'en': userEn, 'pt-br': userPt } };
    }
  }

  public translate(key: string, args?: Record<string, any>, lang: string = 'en'): string {
    this.ensureCache();
    const [domain, ...restParts] = key.split('.');
    const innerKey = restParts.join('.');
    const bundle = (this.cache as any)[domain];
    let text: string | undefined = bundle?.[lang]?.[innerKey];

    if (typeof text !== 'string' || text.length === 0) {
      // Fallback to i18nService if available and configured differently
      try {
        const maybe = this.i18nService.translate(key, { lang, args: args || {} }) as unknown as string;

        if (typeof maybe === 'string' && maybe !== key) {
          text = maybe;
        }
      } catch {
        // ignore and fallback below
      }
    }

    if (typeof text !== 'string' || text.length === 0) {
      // Final fallback to key
      text = key;
    }

    if (args) {
      // Substituição simples por tokens exatos {{key}} para evitar regex e falsos positivos do linter
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
