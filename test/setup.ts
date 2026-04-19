import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresConfig } from '../src/core/datasources/postgres.datasource';
import { AuthModule } from '../src/modules/auth/auth.module';
import { Test } from '@nestjs/testing';
import { INestApplication, ModuleMetadata, ValidationPipe } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

import { ExceptionMiddleware } from '../src/core/middleware/exception.middleware';
import { HeaderResolver, I18nModule, I18nService } from 'nestjs-i18n';
import path from 'node:path';
import * as useragent from 'express-useragent';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import { ResponseMiddleware } from '../src/core/middleware/response.middleware';
import { DictionaryService } from '../src/core/services/dictionary.service';
import { DataSource, DataSourceOptions } from 'typeorm';

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
      TypeOrmModule.forRoot({
        ...PostgresConfig,
        database: process.env.PGDATABASE_TEST
      } as DataSourceOptions),
      AuthModule,
      ...(options?.imports || [])
    ],
    controllers: [...(options?.controllers || [])],
    providers: [...(options?.providers || [])],
    exports: [...(options?.exports || [])],
  })
    .overrideProvider(MailerService)
    .useValue({ sendMail: async () => {} })
    .compile();
  const app = moduleRef.createNestApplication();
  const i18n = app.get<I18nService>(I18nService);
  const dictionary = new DictionaryService(i18n);

  app.use(bodyParser.json({ type: ['application/json'], limit: '1mb' }));
  app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));
  app.use(cookieParser(process.env.COOKIE_SECRET));
  app.use(useragent.express());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalFilters(new ExceptionMiddleware(dictionary));
  app.useGlobalInterceptors(new ResponseMiddleware(dictionary));

  await app.init();

  return app;
}

export async function closeApp(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource, { strict: false });

  await app.close();

  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
}
