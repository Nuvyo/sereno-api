import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { TypeORMError } from 'typeorm';

@Catch()
export class CustomExceptionFilter implements ExceptionFilter {

  constructor() {}

  public catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    let status = HttpStatus.BAD_REQUEST;
    let message = 'Bad Request';

    if (exception instanceof TypeORMError) {
      status = HttpStatus.NOT_FOUND;
      message = 'Not found';
    } else if (exception instanceof HttpException) {
      status = Number(exception.getStatus());
      message = exception.message;
    }

    response.status(status).json({ statusCode: status, message });
  }

}