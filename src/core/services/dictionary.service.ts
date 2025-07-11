import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class DictionaryService {

  constructor(private readonly i18nService: I18nService) {}

  public translate(key: string, args?: Record<string, any>): string {
    return this.i18nService.translate(key, {
      lang: 'pt-br',
      args: args || {},
    });
  }

  public isTranslationKey(value?: string): boolean {
    return typeof value === 'string' && (value.startsWith('auth.') || value.startsWith('user.'));
  }

  public isTranslationObject(value?: Record<string, any>): boolean {
    return typeof value === 'object' && this.isTranslationKey(value.key);
  }
}
