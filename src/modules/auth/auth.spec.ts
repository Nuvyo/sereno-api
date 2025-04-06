import * as assert from 'node:assert/strict';
import { describe, before, it, after } from 'node:test';
import { MeDTO, PsychologistDetailDTO, RefreshTokenDTO, SessionTokensDTO, SigninDTO, SigninResponseDTO, SignupDTO } from '@dtos/auth.dto';
import { PsychologistDetail } from '@entities/psychologist-detail.entity';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { createApp, Requester } from '@test/utils';
import request from 'supertest';

describe('Auth', () => {

  let app: INestApplication;
  let normalUserRequester: Requester;
  let psycologistUserRequester: Requester;

  before(async () => {
    app = await createApp();
    normalUserRequester = new Requester(app);
    psycologistUserRequester = new Requester(app);
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
      const response = await normalUserRequester.post('/v1/auth/signup', body);

      assert.equal(response.status, HttpStatus.BAD_REQUEST);
    });

    it('should receive a body of normal user and succeed', async () => {
      const body: SignupDTO = {
        name: 'John Doe Test',
        email: 'john.test@email.com',
        password: '123456789',
        password_confirmation: '123456789',
        is_psychologist: false,
      };
      const response = await normalUserRequester.post('/v1/auth/signup', body);

      assert.equal(response.status, HttpStatus.CREATED);
      assert.equal(typeof response.body.password, 'undefined');
    });

    it('should receive a body of psychologist user and succeed', async () => {
      const body: SignupDTO = {
        name: 'Mike Wool Test',
        email: 'mike.test@email.com',
        password: '123456456',
        password_confirmation: '123456456',
        is_psychologist: true,
      };
      const response = await normalUserRequester.post('/v1/auth/signup', body);

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
      const response = await normalUserRequester.post('/v1/auth/signup', body);

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
      const response = await normalUserRequester.get('/v1/auth/me');

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });

    it('should fail to access a protected route with an invalid token', async () => {
      normalUserRequester.setTokens('invalid-token', 'invalid-token');

      const response = await normalUserRequester.get('/v1/auth/me');

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });

    it('should succeed to access a protected route with a valid token', async () => {
      const body: SigninDTO = {
        email: 'john.test@email.com',
        password: '123456789',
      };
      
      await normalUserRequester.signin(body);

      const response = await normalUserRequester.get('/v1/auth/me');

      assert.equal(response.status, HttpStatus.OK);
    });
  });

  describe('Signin', () => {
    it('should receive a body with invalid email and fail', async () => {
      const body: SigninDTO = {
        email: 'john.test.1@email.com',
        password: '123456789',
      };
      const response = await normalUserRequester.post('/v1/auth/signin', body);

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
      assert.equal(response.body.message, 'Invalid credentials');
    });

    it('should receive a body with invalid password and fail', async () => {
      const body: SigninDTO = {
        email: 'john.test@email.com',
        password: '12345678',
      };
      const response = await normalUserRequester.post('/v1/auth/signin', body);

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
      assert.equal(response.body.message, 'Invalid credentials');
    });

    it('should receive a body of a normal user and succeed', async () => {
      const body: SigninDTO = {
        email: 'john.test@email.com',
        password: '123456789',
      };
      const response = await normalUserRequester.post('/v1/auth/signin', body);

      assert.equal(response.status, HttpStatus.CREATED);
      assert.equal(typeof response.body.access_token, 'string');
      assert.equal(typeof response.body.refresh_token, 'string');
      assert.equal(typeof response.body.user_id, 'string');

      Object.keys(response.body).forEach((key) => {
        assert.notEqual(key, 'password');
        assert.notEqual(key, 'password_confirmation');
        assert.equal(key in (new SigninResponseDTO()), true);
      });

      normalUserRequester.setTokens(response.body.access_token, response.body.refresh_token);
    });

    it('should receive a body of a psychologist user and succeed', async () => {
      const body: SigninDTO = {
        email: 'mike.test@email.com',
        password: '123456456',
      };
      const response = await psycologistUserRequester.post('/v1/auth/signin', body);

      assert.equal(response.status, HttpStatus.CREATED);
      assert.equal(typeof response.body.access_token, 'string');
      assert.equal(typeof response.body.refresh_token, 'string');
      assert.equal(typeof response.body.user_id, 'string');

      Object.keys(response.body).forEach((key) => {
        assert.notEqual(key, 'password');
        assert.notEqual(key, 'password_confirmation');
        assert.equal(key in (new SigninResponseDTO()), true);
      });

      psycologistUserRequester.setTokens(response.body.access_token, response.body.refresh_token);
    });
  });

  describe('Refresh', () => {
    it('should refresh the access token and succeed', async () => {
      const body: RefreshTokenDTO = { refresh_token: normalUserRequester.getTokens().refresh_token! };
      const response = await normalUserRequester.post('/v1/auth/refresh', body);

      assert.equal(response.status, HttpStatus.CREATED);
      assert.equal(typeof response.body.access_token, 'string');
      assert.equal(typeof response.body.refresh_token, 'string');

      Object.keys(response.body).forEach((key) => {
        assert.equal(key in (new SessionTokensDTO()), true);
      });

      normalUserRequester.setTokens(response.body.access_token, response.body.refresh_token);
    });

    it('should not find the refresh token and fail', async () => {
      const body: RefreshTokenDTO = { refresh_token: '0de903fb-cd85-4fc8-b648-f625f994a515' };
      const response = await normalUserRequester.post('/v1/auth/refresh', body);
      
      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Update Psychologist Detail', () => {
    it('should fail to update without signing in', async () => {
      const body: PsychologistDetailDTO = {
        register_number: '123456789',
        online: true,
        in_person: false,
        online_price: 0,
        in_person_price: 0,
        bio: 'Test bio',
      };
      const response = await request(app.getHttpServer())
        .put('/v1/auth/psychologist-detail')
        .set('Content-Type', 'application/json')
        .send(body);

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });

    it('should fail to update with invalid token', async () => {
      const body: PsychologistDetailDTO = {
        register_number: '123456789',
        online: true,
        in_person: false,
        online_price: 0,
        in_person_price: 0,
        bio: 'Test bio',
      };
      const response = await request(app.getHttpServer())
        .put('/v1/auth/psychologist-detail')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer dsfsdfsdfsdfsdf')
        .send(body);

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });

    it('should fail to update the psychologist detail because user is not psychologist', async () => {
      const body: PsychologistDetailDTO = {
        register_number: '123456789',
        online: true,
        in_person: false,
        online_price: 0,
        in_person_price: 0,
        bio: 'Test bio',
      };
      const response = await normalUserRequester.put('/v1/auth/psychologist-detail', body);

      assert.equal(response.status, HttpStatus.BAD_REQUEST);
    });

    it('should receive an invalid body and fail', async () => {
      const body = {
        register_number: false,
        online: 'true',
        in_person: 0,
        online_price: 999.999,
        in_person_price: -5,
        bio: 'Test bio',
      };
      const response = await psycologistUserRequester.put('/v1/auth/psychologist-detail', body);

      assert.equal(response.status, HttpStatus.BAD_REQUEST);
    });

    it('should receive invalid prices and fail', async () => {
      const body = {
        register_number: false,
        online: 'true',
        in_person: 'false',
        online_price: 9999999999999.99,
        in_person_price: 'false',
        bio: 'Test bio',
      };
      const response = await psycologistUserRequester.put('/v1/auth/psychologist-detail', body);

      assert.equal(response.status, HttpStatus.BAD_REQUEST);
    });

    it('should receive a valid body and succeed', async () => {
      const body: PsychologistDetailDTO = {
        register_number: '123456789',
        online: true,
        in_person: false,
        online_price: 100.55,
        in_person_price: 0.00,
        bio: 'Test bio',
      };
      const response = await psycologistUserRequester.put('/v1/auth/psychologist-detail', body);

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(typeof response.body.id, 'string');
      assert.equal(typeof response.body.register_number, 'string');
      assert.equal(typeof response.body.online, 'boolean');
      assert.equal(typeof response.body.in_person, 'boolean');
      assert.equal(typeof response.body.online_price, 'number');
      assert.equal(typeof response.body.in_person_price, 'number');
      assert.equal(typeof response.body.bio, 'string');

      Object.keys(response.body).forEach((key) => {
        assert.equal(key in (new PsychologistDetail()), true);

        if (key in (new PsychologistDetailDTO())) {
          assert.equal(body[key as keyof PsychologistDetailDTO] === response.body[key], true);
        }
      });
    });
  });

  describe('Me', () => {
    it('should get the normal user data and succeed', async () => {
      const response = await normalUserRequester.get('/v1/auth/me');

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(typeof response.body.id, 'string');
      assert.equal(typeof response.body.name, 'string');
      assert.equal(typeof response.body.email, 'string');
      assert.equal(typeof response.body.psychologist_detail, 'undefined');

      Object.keys(response.body).forEach((key) => {
        assert.notEqual(key, 'password');
        assert.notEqual(key, 'password_confirmation');
        assert.equal(key in (new MeDTO()), true);
      });
    });

    it('should get the psychologist user data and succeed', async () => {
      const response = await psycologistUserRequester.get('/v1/auth/me');

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(typeof response.body.id, 'string');
      assert.equal(typeof response.body.name, 'string');
      assert.equal(typeof response.body.email, 'string');
      assert.equal(typeof response.body.psychologist_detail, 'object');

      Object.keys(response.body).forEach((key) => {
        assert.notEqual(key, 'password');
        assert.notEqual(key, 'password_confirmation');
        assert.equal(key in (new MeDTO()), true);
      });

      Object.keys(response.body.psychologist_detail).forEach((key) => {
        assert.equal(key in (new PsychologistDetail()), true);
      });
    });
  });

  describe('Signout', () => {
    it('should sign out the user and succeed', async () => {
      const response = await normalUserRequester.delete('/v1/auth/signout');

      assert.equal(response.status, HttpStatus.OK);
    });

    it('should fail to sign out the user again', async () => {
      const response = await normalUserRequester.delete('/v1/auth/signout');

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Cancel Account', () => {
    it('should fail to cancel the account without signing in', async () => {
      const response = await normalUserRequester.delete('/v1/auth/cancel-account');

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });

    it('should cancel the account of normal user and succeed', async () => {
      const signinBody: SigninDTO = {
        email: 'john.test@email.com',
        password: '123456789',
      };

      await normalUserRequester.signin(signinBody);

      const response = await normalUserRequester.delete('/v1/auth/cancel-account');

      assert.equal(response.status, HttpStatus.OK);
    });

    it('should cancel the account of psychologist and succeed', async () => {
      const signinBody: SigninDTO = {
        email: 'mike.test@email.com',
        password: '123456456',
      };

      await psycologistUserRequester.signin(signinBody);

      const response = await psycologistUserRequester.delete('/v1/auth/cancel-account');

      assert.equal(response.status, HttpStatus.OK);
    });

    it('should fail to cancel the account again', async () => {
      const response = await normalUserRequester.delete('/v1/auth/cancel-account');

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });
  });
});