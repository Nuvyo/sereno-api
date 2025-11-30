import { Injectable } from '@nestjs/common';

export interface ICookieOptions {
  name: string;
  value: string;
  maxAge?: number;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
}

@Injectable()
export class CookieService {

  constructor() { }

  public serialize(options: ICookieOptions): string {
    const parts: string[] = [];

    parts.push(`${options.name}=${options.value ?? ''}`);

    if (options.path) {
      parts.push(`Path=${options.path}`);
    }

    if (options.maxAge !== undefined && Number.isInteger(options.maxAge)) {
      parts.push(`Max-Age=${options.maxAge}`);
    }

    if (options.secure) {
      parts.push('Secure');
    }

    if (options.httpOnly) {
      parts.push('HttpOnly');
    }

    return parts.join('; ');
  }

  public parse(cookieString: string): ICookieOptions {
    const [nameValuePair, ...attributes] = cookieString.split(';').map(part => part.trim());
    const eqIndex = nameValuePair.indexOf('=');
    let name = '', value = '';

    if (eqIndex !== -1) {
      name = nameValuePair.substring(0, eqIndex);
      value = nameValuePair.substring(eqIndex + 1);
    } else {
      name = nameValuePair;
      value = '';
    }

    const options: ICookieOptions = { name, value };

    attributes.forEach(attr => {
      if (!attr) return;

      const eqAttrIndex = attr.indexOf('=');
      let attrName = '', attrValue = '';

      if (eqAttrIndex !== -1) {
        attrName = attr.substring(0, eqAttrIndex).trim().toLowerCase();
        attrValue = attr.substring(eqAttrIndex + 1).trim();
      } else {
        attrName = attr.trim().toLowerCase();
        attrValue = '';
      }

      switch (attrName) {
        case 'max-age':
          if (attrValue && !isNaN(Number(attrValue))) {
            options.maxAge = parseInt(attrValue, 10);
          }

          break;

        case 'path':
          options.path = attrValue;
          break;

        case 'secure':
          options.secure = true;
          break;

        case 'httponly':
          options.httpOnly = true;
          break;
      }
    });

    return options;
  }

}
