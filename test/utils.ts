import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresDataSource } from '@core/datasources/postgres.datasource';
import { AuthModule } from '@modules/auth/auth.module';
import { Test } from '@nestjs/testing';
import { INestApplication, ModuleMetadata, ValidationPipe } from '@nestjs/common';
import { SigninDTO } from '@core/dtos/auth.dto';
import { CustomExceptionFilter } from '@core/filters/error.filter';
import request from 'supertest';
import { JwtModule } from '@nestjs/jwt';
import * as dotenv from 'dotenv';
import * as bodyParser from 'body-parser';
import * as useragent from 'express-useragent';

dotenv.config();

const BaseApp = {
  imports: [
    JwtModule.register({ global: true, secret: process.env.JWT_SECRET }),
    TypeOrmModule.forRoot(PostgresDataSource),
    AuthModule
  ]
};

export async function createApp(options?: ModuleMetadata) {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ...BaseApp.imports,
      ...(options?.imports || []),
    ],
    controllers: [
      ...(options?.controllers || []),
    ],
    providers: [
      ...(options?.providers || []),
    ],
    exports: [
      ...(options?.exports || []),
    ],
  }).compile();

  const app = moduleRef.createNestApplication();

  app.use(bodyParser.json({ type: ['application/json'], limit: '128mb' }));
  app.use(bodyParser.urlencoded({ limit: '128mb', extended: true }));
  app.use(useragent.express());
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new CustomExceptionFilter());

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
      .set('Authorization', `Bearer ${this.accessToken}`)
      .set('Content-Type', 'application/json')
      .query(query || {});
  }

  public async post(endpoint: string, body: Record<string, any>): Promise<request.Response> {
    return request(this.app.getHttpServer())
      .post(endpoint)
      .set('Authorization', `Bearer ${this.accessToken}`)
      .set('Content-Type', 'application/json')
      .send(body);
  }

  public async put(endpoint: string, body?: Record<string, any>): Promise<request.Response> {
    return request(this.app.getHttpServer())
      .put(endpoint)
      .set('Authorization', `Bearer ${this.accessToken}`)
      .set('Content-Type', 'application/json')
      .send(body);
  }

  public async delete(endpoint: string): Promise<request.Response> {
    return request(this.app.getHttpServer())
      .delete(endpoint)
      .set('Authorization', `Bearer ${this.accessToken}`)
  }

  public async signin(body: SigninDTO): Promise<void> {
    const response = await this.post('/v1/auth/signin', body);

    if (response.status !== 201) {
      throw new Error('Requester Login failed');
    }

    this.setTokens(response.body.accessToken, response.body.refreshToken);
    this.userId = response.body.userId;
  }

  public async signout(): Promise<void> {
    const response = await this.delete('/v1/auth/signout');

    if (response.status !== 200) {
      throw new Error('Requester Logout failed');
    }

    this.setTokens('', '');
    this.userId = null;
  }

  public async cancelAccount(): Promise<void> {
    const response = await this.delete('/v1/auth/cancel-account');

    if (response.status !== 200) {
      throw new Error('Requester Cancel Account failed');
    }

    this.setTokens('', '');
  }

  public setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  public getTokens(): { accessToken: string | null, refreshToken: string | null } {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
    };
  }


}