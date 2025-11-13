import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresConfig } from '../src/core/datasources/postgres.datasource';
import { AuthModule } from '../src/modules/auth/auth.module';
import { Test } from '@nestjs/testing';
import { INestApplication, ModuleMetadata, ValidationPipe } from '@nestjs/common';
import { SigninDTO } from '../src/modules/auth/auth.dto';
import { CustomExceptionFilter } from '../src/core/filters/error.filter';
import { JwtModule } from '@nestjs/jwt';
import { HeaderResolver, I18nModule, I18nService } from 'nestjs-i18n';
import request from 'supertest';
import path from 'node:path';
import * as useragent from 'express-useragent';
import * as bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import { ResponseInterceptor } from '../src/core/interceptors/response.interceptor';
import { DictionaryService } from '../src/core/services/dictionary.service';

dotenv.config();

const BaseApp = {
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
  ],
};

export async function createApp(options?: ModuleMetadata) {
  const moduleRef = await Test.createTestingModule({
    imports: [...BaseApp.imports, ...(options?.imports || [])],
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

export class Requester {

  public userId: string | null = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(private readonly app: INestApplication) {}

  public get(path: string, query?: Record<string, any>): Promise<request.Response> {
    return request(this.app.getHttpServer())
      .get(path)
      .set('language', 'en')
      .set('Authorization', `Bearer ${this.accessToken}`)
      .set('Content-Type', 'application/json')
      .query(query || {});
  }

  public async post(endpoint: string, body?: Record<string, any>): Promise<request.Response> {
    return request(this.app.getHttpServer())
      .post(endpoint)
      .set('language', 'en')
      .set('Authorization', `Bearer ${this.accessToken}`)
      .set('Content-Type', 'application/json')
      .send(body);
  }

  public async put(endpoint: string, body?: Record<string, any>): Promise<request.Response> {
    return request(this.app.getHttpServer())
      .put(endpoint)
      .set('language', 'en')
      .set('Authorization', `Bearer ${this.accessToken}`)
      .set('Content-Type', 'application/json')
      .send(body);
  }

  public async delete(endpoint: string): Promise<request.Response> {
    return request(this.app.getHttpServer())
      .delete(endpoint)
      .set('language', 'en')
      .set('Authorization', `Bearer ${this.accessToken}`);
  }

  public async signin(body: SigninDTO): Promise<void> {
    const response = await this.post('/v1/auth/signin', body);

    if (response.status !== 201) {
      throw new Error('Requester Login failed: ' + response.body.message);
    }

    this.setTokens(response.body.accessToken, response.body.refreshToken);
    this.userId = response.body.userId;
  }

  public async signout(): Promise<void> {
    const response = await this.delete('/v1/auth/signout');

    if (response.status !== 200) {
      throw new Error('Requester Logout failed: ' + response.body.message);
    }

    this.setTokens('', '');
    this.userId = null;
  }

  public async cancelAccount(): Promise<void> {
    const response = await this.delete('/v1/auth/cancel-account');

    if (response.status !== 200) {
      throw new Error('Requester Cancel Account failed: ' + response.body.message);
    }

    this.setTokens('', '');
  }

  public setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  public getTokens(): { accessToken: string | null; refreshToken: string | null } {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
    };
  }

}
