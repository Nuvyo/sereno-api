import * as assert from 'node:assert/strict';
import { describe, before, it, after } from 'node:test';
import { MeDTO, RefreshTokenDTO, SessionTokensDTO, SigninDTO, SigninResponseDTO, SignupDTO } from '@dtos/auth.dto';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { createApp, Requester } from '@test/utils';
import request from 'supertest';

describe('Auth', () => {

  let app: INestApplication;
  let requester: Requester;

  before(async () => {
    app = await createApp();
    requester = new Requester(app);
  });

  after(async () => {
    await app.close();
  });

  describe('Signup', () => {
    it('should receive a body with invalid password confirmation and fail', async () => {
      const body: SignupDTO = {
        name: 'John Doe Test',
        email: 'john.test@email.com',
        password: '123456789',
        password_confirmation: '12345678',
        is_psychologist: false,
      };
      const response = await requester.post('/v1/auth/signup', body);

      assert.equal(response.status, HttpStatus.BAD_REQUEST);
    });

    it('should receive a body and succeed', async () => {
      const body: SignupDTO = {
        name: 'John Doe Test',
        email: 'john.test@email.com',
        password: '123456789',
        password_confirmation: '123456789',
        is_psychologist: false,
      };
      const response = await requester.post('/v1/auth/signup', body);

      assert.equal(response.status, HttpStatus.CREATED);
      assert.equal(typeof response.body.password, 'undefined');
    });

    it('should receive a body with an already existing email and fail', async () => {
      const body: SignupDTO = {
        name: 'John Doe Test',
        email: 'john.test@email.com',
        password: '123456789',
        password_confirmation: '123456789',
        is_psychologist: false,
      };
      const response = await requester.post('/v1/auth/signup', body);

      assert.equal(response.status, HttpStatus.BAD_REQUEST);
    });
  });

  describe('Auth Guard', () => {
    it('should fail to access a protected route without authorization header', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/auth/me')
        .set('Content-Type', 'application/json');

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });

    it('should fail to access a protected route without bearer token', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/auth/me')
        .set('Authorization', 'ddgdgsaadfd')
        .set('Content-Type', 'application/json');

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });
    
    it('should fail to access a protected route without authentication', async () => {
      const response = await requester.get('/v1/auth/me');

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });

    it('should fail to access a protected route with an invalid token', async () => {
      requester.setTokens('invalid-token', 'invalid-token');

      const response = await requester.get('/v1/auth/me');

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });

    it('should succeed to access a protected route with a valid token', async () => {
      const body: SigninDTO = {
        email: 'john.test@email.com',
        password: '123456789',
      };
      
      await requester.signin(body);

      const response = await requester.get('/v1/auth/me');

      assert.equal(response.status, HttpStatus.OK);
    });
  });

  describe('Signin', () => {
    it('should receive a body with invalid email and fail', async () => {
      const body: SigninDTO = {
        email: 'john.test.1@email.com',
        password: '123456789',
      };
      const response = await requester.post('/v1/auth/signin', body);

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
      assert.equal(response.body.message, 'Invalid credentials');
    });

    it('should receive a body with invalid password and fail', async () => {
      const body: SigninDTO = {
        email: 'john.test@email.com',
        password: '12345678',
      };
      const response = await requester.post('/v1/auth/signin', body);

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
      assert.equal(response.body.message, 'Invalid credentials');
    });

    it('should receive a body and succeed', async () => {
      const body: SigninDTO = {
        email: 'john.test@email.com',
        password: '123456789',
      };
      const response = await requester.post('/v1/auth/signin', body);

      assert.equal(response.status, HttpStatus.CREATED);
      assert.equal(typeof response.body.access_token, 'string');
      assert.equal(typeof response.body.refresh_token, 'string');
      assert.equal(typeof response.body.user_id, 'string');

      Object.keys(response.body).forEach((key) => {
        assert.notEqual(key, 'password');
        assert.notEqual(key, 'password_confirmation');
        assert.equal(key in (new SigninResponseDTO()), true);
      });

      requester.setTokens(response.body.access_token, response.body.refresh_token);
    });
  });

  describe('Refresh', () => {
    it('should refresh the access token and succeed', async () => {
      const body: RefreshTokenDTO = { refresh_token: requester.getTokens().refresh_token! };
      const response = await requester.post('/v1/auth/refresh', body);

      assert.equal(response.status, HttpStatus.CREATED);
      assert.equal(typeof response.body.access_token, 'string');
      assert.equal(typeof response.body.refresh_token, 'string');

      Object.keys(response.body).forEach((key) => {
        assert.equal(key in (new SessionTokensDTO()), true);
      });

      requester.setTokens(response.body.access_token, response.body.refresh_token);
    });

    it('should not find the refresh token and fail', async () => {
      const body: RefreshTokenDTO = { refresh_token: 'akhsajhdkkahskd' };
      const response = await requester.post('/v1/auth/refresh', body);
      
      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Me', () => {
    it('should get the user data and succeed', async () => {
      const response = await requester.get('/v1/auth/me');

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(typeof response.body.id, 'string');
      assert.equal(typeof response.body.name, 'string');
      assert.equal(typeof response.body.email, 'string');
      assert.equal(typeof response.body.access_token, 'string');

      Object.keys(response.body).forEach((key) => {
        assert.notEqual(key, 'password');
        assert.notEqual(key, 'password_confirmation');
        assert.equal(key in (new MeDTO()), true);
      });
    });
  });

  describe('Signout', () => {
    it('should sign out the user and succeed', async () => {
      const response = await requester.delete('/v1/auth/signout');

      assert.equal(response.status, HttpStatus.OK);
    });

    it('should fail to sign out the user again', async () => {
      const response = await requester.delete('/v1/auth/signout');

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Cancel Account', () => {
    it('should fail to cancel the account without signing in', async () => {
      const response = await requester.delete('/v1/auth/cancel-account');

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });

    it('should cancel the account and succeed', async () => {
      const signinBody: SigninDTO = {
        email: 'john.test@email.com',
        password: '123456789',
      };

      await requester.signin(signinBody);

      const response = await requester.delete('/v1/auth/cancel-account');

      assert.equal(response.status, HttpStatus.OK);
    });

    it('should fail to cancel the account again', async () => {
      const response = await requester.delete('/v1/auth/cancel-account');

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });
  });
});