import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresConfig } from '../src/core/datasources/postgres.datasource';
import { AuthModule } from '../src/modules/auth/auth.module';
import { Test } from '@nestjs/testing';
import { ModuleMetadata, ValidationPipe } from '@nestjs/common';

import { CustomExceptionFilter } from '../src/core/filters/error.filter';
import { JwtModule } from '@nestjs/jwt';
import { HeaderResolver, I18nModule, I18nService } from 'nestjs-i18n';
import path from 'node:path';
import * as useragent from 'express-useragent';
import * as bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import { ResponseInterceptor } from '../src/core/interceptors/response.interceptor';
import { DictionaryService } from '../src/core/services/dictionary.service';

dotenv.config();

export async function createApp(options?: ModuleMetadata) {
  const moduleRef = await Test.createTestingModule({
    imports: [
      I18nModule.forRoot({
        fallbackLanguage: 'en',
        loaderOptions: {
          path: path.join(__dirname, '../src/i18n/'),
          watch: true,
        },
        resolvers: [{ use: HeaderResolver, options: ['language'] }],
      }),
      JwtModule.register({ global: true, secret: process.env.JWT_SECRET }),
      TypeOrmModule.forRoot(PostgresConfig),
      AuthModule,
      ...(options?.imports || [])
    ],
    controllers: [...(options?.controllers || [])],
    providers: [...(options?.providers || [])],
    exports: [...(options?.exports || [])],
  }).compile();
  const app = moduleRef.createNestApplication();
  const i18n = app.get<I18nService>(I18nService);
  const dictionary = new DictionaryService(i18n);

  app.use(bodyParser.json({ type: ['application/json'], limit: '128mb' }));
  app.use(bodyParser.urlencoded({ limit: '128mb', extended: true }));
  app.use(useragent.express());
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new CustomExceptionFilter(dictionary));
  app.useGlobalInterceptors(new ResponseInterceptor(dictionary));

  await app.init();

  return app;
}
