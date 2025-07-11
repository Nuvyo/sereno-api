import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '@modules/app.module';
import { CustomExceptionFilter } from '@core/filters/error.filter';
import * as dotenv from 'dotenv';
import * as bodyParser from 'body-parser';
import * as useragent from 'express-useragent';
import cors from 'cors';
import { I18nService } from 'nestjs-i18n';
import { ResponseInterceptor } from '@core/interceptors/response.interceptor';
import { DictionaryService } from '@core/services/dictionary.service';

dotenv.config();

async function bootstrap() {
  const port = Number(process.env.PORT);
  const app = await NestFactory.create(AppModule);
  const i18n = app.get<I18nService>(I18nService);
  const dictionary = new DictionaryService(i18n);
  const corsOptions: cors.CorsOptions = {
    allowedHeaders: [
      'Origin',
      'Content-Type',
      'Accept',
      'Authorization',
      'language',
      'timezone',
    ],
    credentials: true,
    methods: 'GET,POST,PUT,DELETE',
    origin: '*'
  };

  app.use(cors(corsOptions));
  app.use(bodyParser.json({ type: ['application/json'], limit: '128mb' }));
  app.use(bodyParser.urlencoded({ limit: '128mb', extended: true }));
  app.use(useragent.express());
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new CustomExceptionFilter(dictionary));
  app.useGlobalInterceptors(new ResponseInterceptor(dictionary));

  await app.listen(port);
}

void bootstrap();
