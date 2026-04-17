import * as assert from 'node:assert/strict';
import { describe, before, it, after } from 'node:test';
import {
  MeResponseDTO,
  SigninDTO,
  SignupDTO,
} from '../auth/auth.dto';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { closeApp, createApp } from '../../../test/setup';
import Requester from '../../../test/requester';
import { Session } from '../../core/entities/session.entity';
import { daysInMilliseconds } from '../../core/utils/utils';

const VALID_PASSWORD = 'Test@1234';

describe('v1/auth', () => {
  let app: INestApplication;
  let normalUserRequester1: Requester;

  before(async () => {
    app = await createApp();
    normalUserRequester1 = new Requester(app);
  });

  after(async () => {
    await closeApp(app);
  });

  describe('[POST] /signup', () => {
    it('should fail when password and passwordConfirmation do not match', async () => {
      const body = {
        name: 'John Doe Test',
        email: 'john.test.auth@email.com',
        password: VALID_PASSWORD,
        passwordConfirmation: VALID_PASSWORD + 'x',
      } as SignupDTO;
      const response = await normalUserRequester1.post('/v1/auth/signup', body);

      assert.equal(response.status, HttpStatus.BAD_REQUEST);
    });

    it('should fail when password does not meet strength requirements', async () => {
      const body = {
        name: 'John Doe Test',
        email: 'john.test.auth@email.com',
        password: 'weakpassword',
        passwordConfirmation: 'weakpassword',
      } as SignupDTO;
      const response = await normalUserRequester1.post('/v1/auth/signup', body);

      assert.equal(response.status, HttpStatus.BAD_REQUEST);
    });

    it('should receive a body of normal user and succeed', async () => {
      const body = {
        name: 'John Doe Test',
        email: 'john.test.auth@email.com',
        password: VALID_PASSWORD,
        passwordConfirmation: VALID_PASSWORD,
      } as SignupDTO;
      const response = await normalUserRequester1.post('/v1/auth/signup', body);

      assert.equal(response.status, HttpStatus.CREATED);
      assert.equal(typeof response.body.message, 'string');
    });

    it('should receive a body with an already existing email and fail', async () => {
      const body = {
        name: 'John Doe Test',
        email: 'john.test.auth@email.com',
        password: VALID_PASSWORD,
        passwordConfirmation: VALID_PASSWORD,
      } as SignupDTO;
      const response = await normalUserRequester1.post('/v1/auth/signup', body);

      assert.equal(response.status, HttpStatus.BAD_REQUEST);
      assert.equal(response.body.message, 'Email already in use');
    });
  });

  describe('[POST] /signin', () => {
    it('should receive a body with invalid email and fail', async () => {
      const body: SigninDTO = {
        email: 'john.test.1@email.com',
        password: VALID_PASSWORD,
      };
      const response = await normalUserRequester1.post('/v1/auth/signin', body);

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
      assert.equal(response.body.message, 'Invalid credentials');
    });

    it('should receive a body with invalid password and fail', async () => {
      const body: SigninDTO = {
        email: 'john.test.auth@email.com',
        password: 'Wrong@1234',
      };
      const response = await normalUserRequester1.post('/v1/auth/signin', body);

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
      assert.equal(response.body.message, 'Invalid credentials');
    });

    it('should receive a body of a normal user and succeed', async () => {
      const body: SigninDTO = {
        email: 'john.test.auth@email.com',
        password: VALID_PASSWORD,
      };
      const response = await normalUserRequester1.post('/v1/auth/signin', body);

      assert.equal(response.status, HttpStatus.CREATED);

      const responseBody = response.body as Session;

      assert.equal(typeof responseBody.token, 'string');
      assert.equal(typeof responseBody.userId, 'string');
      assert.equal(typeof responseBody.expiresAt, 'string');
      assert.notEqual(new Date(responseBody.expiresAt), NaN);

      const createdAt = new Date(responseBody.createdAt);
      const expiresAt = new Date(responseBody.expiresAt);

      createdAt.setMilliseconds(0);
      expiresAt.setMilliseconds(0);

      const diffInMs = expiresAt.getTime() - createdAt.getTime();
      const expectedDiffInMs = daysInMilliseconds(30);

      assert.equal(diffInMs, expectedDiffInMs);

      Object.keys(response.body).forEach((key) => {
        assert.equal(key in new Session(), true);
      });

      normalUserRequester1.setSession(responseBody);
    });
  });

  describe('[GET] /me', () => {
    it('should get the normal user data and succeed', async () => {
      const response = await normalUserRequester1.get('/v1/auth/me');

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(typeof response.body.id, 'string');
      assert.equal(typeof response.body.name, 'string');
      assert.equal(typeof response.body.email, 'string');
      assert.equal(typeof response.body.crp, 'undefined');
      assert.equal(typeof response.body.sessionCost, 'undefined');
      assert.equal(typeof response.body.bio, 'undefined');

      Object.keys(response.body).forEach((key) => {
        assert.notEqual(key, 'password');
        assert.notEqual(key, 'passwordConfirmation');
        assert.equal(key in new MeResponseDTO(), true);
      });
    });
  });

  describe('[PATCH] /me', () => {
    it('should update the user name successfully', async () => {
      const updateBody = { name: 'Updated Name' };
      const response = await normalUserRequester1.patch('/v1/auth/me', updateBody);

      assert.equal(response.status, HttpStatus.OK);
      assert.match(response.body.message, /Profile updated successfully/);

      const meRes = await normalUserRequester1.get('/v1/auth/me');

      assert.equal(meRes.body.name, 'Updated Name');
    });

    it('should ignore extra fields due to whitelist validation', async () => {
      const updateBody = { name: 'Whitelist Test', email: 'hacker@evil.com', password: 'Hacked@999' };
      const response = await normalUserRequester1.patch('/v1/auth/me', updateBody);

      assert.equal(response.status, HttpStatus.OK);

      const meRes = await normalUserRequester1.get('/v1/auth/me');

      assert.equal(meRes.body.name, 'Whitelist Test');
      assert.notEqual(meRes.body.email, 'hacker@evil.com');
    });
  });

  describe('[POST] /signout', () => {
    it('should sign out the user and succeed', async () => {
      const response = await normalUserRequester1.post('/v1/auth/signout');

      assert.equal(response.status, HttpStatus.CREATED);
      assert.match(response.body.message, /Logout successful/);
    });

    it('should fail to sign out the user again', async () => {
      const response = await normalUserRequester1.post('/v1/auth/signout');

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });
  });

  describe('[DELETE] /cancel-account', () => {
    it('should fail to cancel the account without signing in', async () => {
      const response = await normalUserRequester1.delete('/v1/auth/cancel-account');

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });

    it('should cancel the account of normal user and succeed', async () => {
      const signinBody: SigninDTO = {
        email: 'john.test.auth@email.com',
        password: VALID_PASSWORD,
      };

      await normalUserRequester1.signin(signinBody);

      const response = await normalUserRequester1.delete('/v1/auth/cancel-account');

      assert.equal(response.status, HttpStatus.OK);
      assert.match(response.body.message, /Account cancelled successfully/);
    });

    it('should fail to cancel the account again', async () => {
      const response = await normalUserRequester1.delete('/v1/auth/cancel-account');

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });
  });
});
