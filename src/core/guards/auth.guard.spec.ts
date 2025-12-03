import { HttpStatus, INestApplication } from '@nestjs/common';
import * as assert from 'node:assert/strict';
import { describe, before, it, after } from 'node:test';
import { createApp } from '../../../test/setup';
import request from 'supertest';
import { SigninDTO, SignupDTO } from '../../modules/auth/auth.dto';
import Requester from '../../../test/requester';
import { DataSource } from 'typeorm';
import { Session } from '../entities/session.entity';
import { daysInMilliseconds } from '../utils/utils';

describe('[Decorator] Auth Guard', () => {
  let userData: SignupDTO;
  let app: INestApplication;
  let normalUserRequester: Requester;

  before(async () => {
    app = await createApp();
    normalUserRequester = new Requester(app);

    userData = await normalUserRequester.signup();
  });

  after(async () => {
    await normalUserRequester.cancelAccount();
    await app.close();
  });

  describe('Guard', () => {
    it('should fail to access a protected route without authorization header', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/auth/me')
        .set('Content-Type', 'application/json')
        .timeout({ response: 5000, deadline: 6000 });

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });

    it('should fail to access a protected route without token', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/auth/me')
        .set('Cookie', 'sid=')
        .set('Content-Type', 'application/json')
        .timeout({ response: 5000, deadline: 6000 });

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });

    it('should fail to access a protected route with expired session token', async () => {
      const dataSource = app.get(DataSource);
      const signInBody: SigninDTO = {
        email: userData.email,
        password: userData.password,
      };

      await normalUserRequester.signin(signInBody);

      const session = await dataSource.getRepository(Session).findOneBy({ user: { id: normalUserRequester.getSession()?.userId } });

      assert.ok(session);

      // Expires the session
      await dataSource.getRepository(Session).update({ id: session.id }, {
        expiresAt: new Date(Date.now() - daysInMilliseconds(30)) // 30 days ago
      });

      const response = await normalUserRequester.get('/v1/auth/me');

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);

      // Returns the session to valid state for other tests
      await dataSource.getRepository(Session).update({ id: session.id }, {
        expiresAt: new Date(Date.now() + daysInMilliseconds(30)) // 30 days ahead
      });
    });

    it('should succeed to access a protected route with a valid token', async () => {
      const signInBody: SigninDTO = {
        email: userData.email,
        password: userData.password,
      };

      await normalUserRequester.signin(signInBody);

      const response = await normalUserRequester.get('/v1/auth/me');

      assert.equal(response.status, HttpStatus.OK);
    });
  });
});
