import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DictionaryService } from '../services/dictionary.service';
import { Request } from 'express';

@Injectable()
export class ResponseMiddleware<T> implements NestInterceptor<T, any> {

  constructor(private readonly dictionary: DictionaryService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (data?.message) {
          let message = data.message;

          if (this.dictionary.isTranslationKey(message as any)) {
            const req = context.switchToHttp().getRequest<Request>();
            
            this.dictionary.setLanguage(req);

            message = this.dictionary.translate(message as any);
          } else if (this.dictionary.isTranslationObject(message as any)) {
            const req = context.switchToHttp().getRequest<Request>();
            const key = (message as Record<string, any>).key;
            const args = (message as Record<string, any>).args || {};

            this.dictionary.setLanguage(req);

            message = this.dictionary.translate(key, args);
          }

          return {
            ...data,
            message,
          };
        }

        return data;
      }),
    );
  }

}
