import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { SigninDTO, SignupDTO } from '../src/modules/auth/auth.dto';
import { faker } from '@faker-js/faker';
import { Session } from '../src/core/entities/session.entity';
import assert from 'node:assert/strict';

export default class Requester {

  private session: Session | null = null;

  constructor(private readonly app: INestApplication) {}

  public get(path: string, query?: Record<string, any>): Promise<request.Response> {
    return request(this.app.getHttpServer())
      .get(path)
      .set('language', 'en')
      .set('Authorization', `Bearer ${this.session?.token || ''}`)
      .set('Content-Type', 'application/json')
      .query(query || {})
      .timeout({ response: 5000, deadline: 6000 });
  }

  public async post(endpoint: string, body?: Record<string, any>): Promise<request.Response> {
    return request(this.app.getHttpServer())
      .post(endpoint)
      .set('language', 'en')
      .set('Authorization', `Bearer ${this.session?.token || ''}`)
      .set('Content-Type', 'application/json')
      .send(body)
      .timeout({ response: 5000, deadline: 6000 });
  }

  public async put(endpoint: string, body?: Record<string, any>): Promise<request.Response> {
    return request(this.app.getHttpServer())
      .put(endpoint)
      .set('language', 'en')
      .set('Authorization', `Bearer ${this.session?.token || ''}`)
      .set('Content-Type', 'application/json')
      .send(body)
      .timeout({ response: 5000, deadline: 6000 });
  }

  public async patch(endpoint: string, body?: Record<string, any>): Promise<request.Response> {
    return request(this.app.getHttpServer())
      .patch(endpoint)
      .set('language', 'en')
      .set('Authorization', `Bearer ${this.session?.token || ''}`)
      .set('Content-Type', 'application/json')
      .send(body)
      .timeout({ response: 5000, deadline: 6000 });
  }

  public async delete(endpoint: string): Promise<request.Response> {
    return request(this.app.getHttpServer())
      .delete(endpoint)
      .set('language', 'en')
      .set('Authorization', `Bearer ${this.session?.token || ''}`)
      .timeout({ response: 5000, deadline: 6000 });
  }

  // Helpers
  public async signup(body?: Partial<SignupDTO>): Promise<SignupDTO> {
    body = body || {};
    body.name = body.name || faker.person.firstName() + ' ' + faker.person.lastName();
    body.email = body.email || faker.internet.email();
    body.password = body.password || 'validpassword';
    body.passwordConfirmation = body.password;

    const response = await this.post('/v1/auth/signup', body);
    const result = `Requester Signup Status OK: ${response.ok}${!response.ok ? ` - ${JSON.stringify(response.body.message)}` : ''}`;

    assert.equal(result, 'Requester Signup Status OK: true');

    return body as SignupDTO;
  }

  public async signin(body: SigninDTO): Promise<void> {
    const response = await this.post('/v1/auth/signin', body);
    const result = `Requester Login Status OK: ${response.ok}${!response.ok ? ` - ${JSON.stringify(response.body.message)}` : ''}`;

    assert.equal(result, 'Requester Login Status OK: true');

    this.setSession(response.body);
  }

  public async signout(): Promise<void> {
    const response = await this.post('/v1/auth/signout');
    const result = `Requester Signout Status OK: ${response.ok}${!response.ok ? ` - ${JSON.stringify(response.body.message)}` : ''}`;

    assert.equal(result, 'Requester Signout Status OK: true');

    this.setSession(null);
  }

  public async cancelAccount(): Promise<void> {
    if (this.session === null) {
      return;
    }

    const response = await this.delete('/v1/auth/cancel-account');
    const result = `Requester Cancel Account Status OK: ${response.ok}${!response.ok ? ` - ${JSON.stringify(response.body.message)}` : ''}`;

    assert.equal(result, 'Requester Cancel Account Status OK: true');

    this.setSession(null);
  }

  public async signupAndSignin(body: Partial<SignupDTO>): Promise<void> {
    await this.signup(body);
    await this.signin({ email: body.email!, password: body.password! });
  }

  public setSession(session: Session | null): void {
    this.session = session;
  }

  public getSession(): Session | null {
    return this.session;
  }

}
