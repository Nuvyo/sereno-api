import { HttpStatus, INestApplication } from '@nestjs/common';
import * as assert from 'node:assert/strict';
import { describe, before, it, after } from 'node:test';
import { createApp, Requester } from '../../../test/utils';
import request from 'supertest';
import { SigninDTO } from '../../modules/auth/auth.dto';
import { registerUserDummy } from '../../../test/dummies';

describe('[Decorator] Auth Guard', () => {
  let app: INestApplication;
  let normalUserRequester: Requester;

  before(async () => {
    app = await createApp();

    await registerUserDummy(app, 'john.auth.guard@email.com');

    normalUserRequester = new Requester(app);
  });

  after(async () => {
    await normalUserRequester.cancelAccount();
    await app.close();
  });

  describe('Guard', () => {
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
      const response = await normalUserRequester.get('/v1/auth/me');
  
      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });
  
    it('should fail to access a protected route with an invalid token', async () => {
      normalUserRequester.setTokens('invalid-token', 'invalid-token');
  
      const response = await normalUserRequester.get('/v1/auth/me');
  
      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });
  
    it('should succeed to access a protected route with a valid token', async () => {
      const signInBody: SigninDTO = {
        email: 'john.auth.guard@email.com',
        password: '123456456',
      };
      
      await normalUserRequester.signin(signInBody);
  
      const response = await normalUserRequester.get('/v1/auth/me');
  
      assert.equal(response.status, HttpStatus.OK);
    });
  });
});
