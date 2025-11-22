import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { SigninDTO, SignupDTO } from '../src/modules/auth/auth.dto';
import { faker } from '@faker-js/faker';
import { Session } from '../src/core/entities/session.entity';

export default class Requester {

  public userId: string | null = null;
  private session: Session | null = null;

  constructor(private readonly app: INestApplication) {}

  public get(path: string, query?: Record<string, any>): Promise<request.Response> {
    return request(this.app.getHttpServer())
      .get(path)
      .set('language', 'en')
      .set('Authorization', `Bearer ${this.session?.token || ''}`)
      .set('Content-Type', 'application/json')
      .query(query || {});
  }

  public async post(endpoint: string, body?: Record<string, any>): Promise<request.Response> {
    return request(this.app.getHttpServer())
      .post(endpoint)
      .set('language', 'en')
      .set('Authorization', `Bearer ${this.session?.token || ''}`)
      .set('Content-Type', 'application/json')
      .send(body);
  }

  public async put(endpoint: string, body?: Record<string, any>): Promise<request.Response> {
    return request(this.app.getHttpServer())
      .put(endpoint)
      .set('language', 'en')
      .set('Authorization', `Bearer ${this.session?.token || ''}`)
      .set('Content-Type', 'application/json')
      .send(body);
  }

  public async patch(endpoint: string, body?: Record<string, any>): Promise<request.Response> {
    return request(this.app.getHttpServer())
      .patch(endpoint)
      .set('language', 'en')
      .set('Authorization', `Bearer ${this.session?.token || ''}`)
      .set('Content-Type', 'application/json')
      .send(body);
  }

  public async delete(endpoint: string): Promise<request.Response> {
    return request(this.app.getHttpServer())
      .delete(endpoint)
      .set('language', 'en')
      .set('Authorization', `Bearer ${this.session?.token || ''}`);
  }

  // Helpers
  public async signup(body: Partial<SignupDTO>): Promise<void> {
    body.name = body.name || faker.person.firstName() + ' ' + faker.person.lastName();
    body.email = body.email || faker.internet.email();
    body.password = body.password || 'validpassword';
    body.passwordConfirmation = body.password;

    const response = await this.post('/v1/auth/signup', body);

    if (response.status !== 201) {
      throw new Error('Requester Create User failed: ' + response.body.message);
    }
  }

  public async signin(body: SigninDTO): Promise<void> {
    const response = await this.post('/v1/auth/signin', body);

    if (response.status !== 201) {
      throw new Error('Requester Login failed: ' + response.body.message);
    }

    this.setSession(response.body);
    this.userId = response.body.userId;
  }

  public async signupAndSignin(body: Partial<SignupDTO>): Promise<void> {
    await this.signup(body);
    await this.signin({ email: body.email!, password: body.password! });
  }

  public async signout(): Promise<void> {
    const response = await this.post('/v1/auth/signout');

    if (!response.ok) {
      throw new Error('Requester Logout failed: ' + response.body.message);
    }

    this.setSession(null);
    this.userId = null;
  }

  public async cancelAccount(): Promise<void> {
    const response = await this.delete('/v1/auth/cancel-account');

    if (response.status !== 200) {
      throw new Error('Requester Cancel Account failed: ' + response.body.message);
    }

    this.setSession(null);
  }

  public setSession(session: Session | null): void {
    this.session = session;
  }

  public getSession(): Session | null {
    return this.session;
  }

}
