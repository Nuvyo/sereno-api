import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { TypeORMError } from 'typeorm';
import { DictionaryService } from '../services/dictionary.service';

@Catch()
export class ExceptionMiddleware implements ExceptionFilter {

  constructor(private readonly dictionary: DictionaryService) {}

  public catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    let status = HttpStatus.BAD_REQUEST;
    let message: string | Record<string, any> | undefined;

    if (exception instanceof TypeORMError) {
      const isNotFound = exception.stack?.startsWith('EntityNotFoundError');

      message = exception.message;

      if (isNotFound) {
        status = HttpStatus.NOT_FOUND;

        if (message.includes('Could not find any entity of type "User"')) {
          message = 'user.not_found';
        }
      }
    } else if (exception instanceof HttpException) {
      status = Number(exception.getStatus());
      const responsePayload = exception.getResponse();

      if (typeof responsePayload === 'object' && responsePayload !== null) {
        const maybeMessage = (responsePayload as any).message;

        if (maybeMessage) {
          message = maybeMessage;
        } else if ('key' in (responsePayload as any)) {
          message = { key: (responsePayload as any).key, args: (responsePayload as any).args };
        } else {
          message = exception.message;
        }
      } else if (typeof responsePayload === 'string') {
        message = responsePayload;
      } else {
        message = exception.message;
      }
    } else {
      message = exception.message;
    }

    if (Array.isArray(message) && message.some((msg) => msg.includes('.validator.'))) {
      message = message[0];
    }

    if (this.dictionary.isTranslationKey(message as any)) {
      const req = ctx.getRequest<Request>();

      this.dictionary.setLanguage(req);

      message = this.dictionary.translate(message as any);
    } else if (this.dictionary.isTranslationObject(message as any)) {
      const req = ctx.getRequest<Request>();
      const key = (message as Record<string, any>).key;
      const args = (message as Record<string, any>).args || {};

      this.dictionary.setLanguage(req);

      message = this.dictionary.translate(key, args);
    }

    response.status(status).json({ statusCode: status, message });
  }

}
