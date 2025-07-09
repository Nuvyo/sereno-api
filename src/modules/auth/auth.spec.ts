import * as assert from 'node:assert/strict';
import { describe, before, it, after } from 'node:test';
import { MeResponseDTO, RefreshTokenDTO, RefreshTokensResponseDTO, SigninDTO, SigninResponseDTO, SignupDTO, UpdateMeDTO } from '@modules/auth/auth.dto';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { createApp, Requester } from '@test/utils';
import request from 'supertest';
import { Modality } from '@core/entities/user.entity';

describe('v1/auth', () => {

  let app: INestApplication;
  let normalUserRequester1: Requester;
  let psycologistUserRequester2: Requester;
  let psycologistUserRequester: Requester;

  before(async () => {
    app = await createApp();
    normalUserRequester1 = new Requester(app);
    psycologistUserRequester = new Requester(app);
    psycologistUserRequester2 = new Requester(app);
  });

  after(async () => {
    await app.close();
  });

  describe('[POST] /signup', () => {
    it('should receive a body with invalid password confirmation and fail', async () => {
      const body = {
        name: 'John Doe Test',
        email: 'john.test.auth@email.com',
        password: '123456789',
        passwordConfirmation: '12345678',
        psychologist: false,
      } as SignupDTO;
      const response = await normalUserRequester1.post('/v1/auth/signup', body);

      assert.equal(response.status, HttpStatus.BAD_REQUEST);
    });

    it('should receive a body of normal user and succeed', async () => {
      const body = {
        name: 'John Doe Test',
        email: 'john.test.auth@email.com',
        password: '123456789',
        passwordConfirmation: '123456789',
        psychologist: false,
      } as SignupDTO;
      const response = await normalUserRequester1.post('/v1/auth/signup', body);

      assert.equal(response.status, HttpStatus.CREATED);
      assert.equal(typeof response.body.message, 'string');
    });

    it('should receive a body of psychologist user and succeed', async () => {
      const body = {
        name: 'Mike Wool Test',
        email: 'mike.test.auth@email.com',
        password: '123456456',
        passwordConfirmation: '123456456',
        psychologist: true,
        public: true,
        crp: '123456-12',
        modality: Modality.Both,
        sessionCost: 200.00,
        bio: 'Experienced psychologist with a focus on cognitive behavioral therapy.',
        address: {
          street: 'Elm St',
          number: '123',
          city: 'Springfield',
          state: 'SP',
          countryCode: 'BR',
          postalCode: '12345678',
        }
      } as SignupDTO;
      const response = await normalUserRequester1.post('/v1/auth/signup', body);

      assert.equal(response.status, HttpStatus.CREATED);
      assert.equal(typeof response.body.message, 'string');
    });

    it('should receive a body of public psychologist user and succeed', async () => {
      const body = {
        name: 'Dr. Sarah Connor',
        email: 'sarah.connor.auth@email.com',
        password: '123456789',
        passwordConfirmation: '123456789',
        psychologist: true,
        public: true,
        crp: '12345-12',
        modality: Modality.Both,
        sessionCost: 150.00,
        bio: 'Experienced psychologist specialized in cognitive behavioral therapy.',
        address: {
          street: 'Main St',
          number: '456',
          city: 'Springfield',
          state: 'SP',
          countryCode: 'BR',
          postalCode: '12345678',
        }
      } as SignupDTO;
      const response = await psycologistUserRequester2.post('/v1/auth/signup', body);

      assert.equal(response.status, HttpStatus.CREATED);
      assert.equal(typeof response.body.message, 'string');
    });

    it('should receive a body with an already existing email and fail', async () => {
      const body = {
        name: 'John Doe Test',
        email: 'john.test.auth@email.com',
        password: '123456789',
        passwordConfirmation: '123456789',
        psychologist: false,
      } as SignupDTO;
      const response = await normalUserRequester1.post('/v1/auth/signup', body);

      assert.equal(response.status, HttpStatus.BAD_REQUEST);
      assert.equal(response.body.message, 'User already exists');
    });

    it('should fail when public psychologist is missing required fields', async () => {
      const body = {
        name: 'Dr. Incomplete',
        email: 'incomplete@email.com',
        password: '123456789',
        passwordConfirmation: '123456789',
        psychologist: true,
        public: true,
        // Missing crp, modality, sessionCost
      } as SignupDTO;
      const response = await normalUserRequester1.post('/v1/auth/signup', body);

      assert.equal(response.status, HttpStatus.BAD_REQUEST);
    });
  });

  describe('[POST] /signin', () => {
    it('should receive a body with invalid email and fail', async () => {
      const body: SigninDTO = {
        email: 'john.test.1@email.com',
        password: '123456789',
      };
      const response = await normalUserRequester1.post('/v1/auth/signin', body);

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
      assert.equal(response.body.message, 'Invalid credentials');
    });

    it('should receive a body with invalid password and fail', async () => {
      const body: SigninDTO = {
        email: 'john.test.auth@email.com',
        password: '12345678',
      };
      const response = await normalUserRequester1.post('/v1/auth/signin', body);

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
      assert.equal(response.body.message, 'Invalid credentials');
    });

    it('should receive a body of a normal user and succeed', async () => {
      const body: SigninDTO = {
        email: 'john.test.auth@email.com',
        password: '123456789',
      };
      const response = await normalUserRequester1.post('/v1/auth/signin', body);

      assert.equal(response.status, HttpStatus.CREATED);
      assert.equal(typeof response.body.accessToken, 'string');
      assert.equal(typeof response.body.refreshToken, 'string');
      assert.equal(typeof response.body.userId, 'string');

      Object.keys(response.body).forEach((key) => {
        assert.notEqual(key, 'password');
        assert.notEqual(key, 'passwordConfirmation');
        assert.equal(key in (new SigninResponseDTO()), true);
      });

      normalUserRequester1.setTokens(response.body.accessToken, response.body.refreshToken);
    });

    it('should receive a body of a psychologist user and succeed', async () => {
      // signin first psychologist
      const body: SigninDTO = {
        email: 'mike.test.auth@email.com',
        password: '123456456',
      };
      const response = await psycologistUserRequester.post('/v1/auth/signin', body);

      assert.equal(response.status, HttpStatus.CREATED);
      assert.equal(typeof response.body.accessToken, 'string');
      assert.equal(typeof response.body.refreshToken, 'string');
      assert.equal(typeof response.body.userId, 'string');

      Object.keys(response.body).forEach((key) => {
        assert.notEqual(key, 'password');
        assert.notEqual(key, 'passwordConfirmation');
        assert.equal(key in (new SigninResponseDTO()), true);
      });

      psycologistUserRequester.setTokens(response.body.accessToken, response.body.refreshToken);

      // signin second psychologist
      const body2: SigninDTO = {
        email: 'sarah.connor.auth@email.com',
        password: '123456789',
      };
      const response2 = await psycologistUserRequester2.post('/v1/auth/signin', body2);
      
      assert.equal(response2.status, HttpStatus.CREATED);
      assert.equal(typeof response2.body.accessToken, 'string');
      assert.equal(typeof response2.body.refreshToken, 'string');
      assert.equal(typeof response2.body.userId, 'string');
      
      Object.keys(response2.body).forEach((key) => {
        assert.notEqual(key, 'password');
        assert.notEqual(key, 'passwordConfirmation');
        assert.equal(key in (new SigninResponseDTO()), true);
      });

      psycologistUserRequester2.setTokens(response2.body.accessToken, response2.body.refreshToken);
    });
  });

  describe('[POST] /refresh', () => {
    it('should refresh the access token and succeed', async () => {
      const body: RefreshTokenDTO = { refreshToken: normalUserRequester1.getTokens().refreshToken! };
      const response = await normalUserRequester1.post('/v1/auth/refresh', body);

      assert.equal(response.status, HttpStatus.CREATED);
      assert.equal(typeof response.body.accessToken, 'string');
      assert.equal(typeof response.body.refreshToken, 'string');

      Object.keys(response.body).forEach((key) => {
        assert.equal(key in (new RefreshTokensResponseDTO()), true);
      });

      normalUserRequester1.setTokens(response.body.accessToken, response.body.refreshToken);
    });

    it('should not find the refresh token and fail', async () => {
      const body: RefreshTokenDTO = { refreshToken: '0de903fb-cd85-4fc8-b648-f625f994a515' };
      const response = await normalUserRequester1.post('/v1/auth/refresh', body);
      
      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
      assert.equal(response.body.message, 'Invalid refresh token');
    });
  });

  describe('[PUT] /me', () => {
    it('should fail to update without signing in', async () => {
      const body = {
        name: 'Updated Name',
        bio: 'Updated bio',
      } as UpdateMeDTO;
      const response = await request(app.getHttpServer())
        .put('/v1/auth/me')
        .set('Content-Type', 'application/json')
        .send(body);

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });

    it('should fail to update with invalid token', async () => {
      const body = {
        name: 'Updated Name',
        bio: 'Updated bio',
      } as UpdateMeDTO;
      const response = await request(app.getHttpServer())
        .put('/v1/auth/me')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer dsfsdfsdfsdfsdf')
        .send(body);

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });

    it('should update normal user data and succeed', async () => {
      const body = {
        name: 'John Doe Updated',
      } as UpdateMeDTO;
      const response = await normalUserRequester1.put('/v1/auth/me', body);

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(typeof response.body.id, 'string');
    });

    it('should receive an invalid body and fail', async () => {
      const body = {
        crp: false,
        modality: 'invalid-modality',
        sessionCost: 999.999,
        bio: 'Test bio',
      };
      const response = await psycologistUserRequester.put('/v1/auth/me', body);

      assert.equal(response.status, HttpStatus.BAD_REQUEST);
    });

    it('should receive invalid prices and fail', async () => {
      const body = {
        sessionCost: 9999999999999.99,
      };
      const response = await psycologistUserRequester.put('/v1/auth/me', body);

      assert.equal(response.status, HttpStatus.BAD_REQUEST);
    });

    it('should update psychologist data and succeed', async () => {
      const body = {
        crp: '123456789',
        modality: Modality.Both,
        sessionCost: 100.55,
        bio: 'Updated bio',
      } as UpdateMeDTO;
      const response = await psycologistUserRequester.put('/v1/auth/me', body);
      
      assert.equal(response.status, HttpStatus.OK);
      assert.equal(typeof response.body.id, 'string');
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
      assert.equal(typeof response.body.modality, 'undefined');
      assert.equal(typeof response.body.sessionCost, 'undefined');
      assert.equal(typeof response.body.bio, 'undefined');

      Object.keys(response.body).forEach((key) => {
        assert.notEqual(key, 'password');
        assert.notEqual(key, 'passwordConfirmation');
        assert.equal(key in (new MeResponseDTO()), true);
      });
    });

    it('should get the psychologist user data and succeed', async () => {
      const response = await psycologistUserRequester.get('/v1/auth/me');

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(typeof response.body.id, 'string');
      assert.equal(typeof response.body.name, 'string');
      assert.equal(typeof response.body.email, 'string');
      assert.equal(typeof response.body.crp, 'string');
      assert.equal(typeof response.body.modality, 'string');
      assert.equal(typeof response.body.sessionCost, 'number');
      assert.equal(typeof response.body.bio, 'string');

      Object.keys(response.body).forEach((key) => {
        assert.notEqual(key, 'password');
        assert.notEqual(key, 'passwordConfirmation');
        assert.equal(key in (new MeResponseDTO()), true);
      });
    });    
  });

  describe('[POST] /signout', () => {
    it('should sign out the user and succeed', async () => {
      const response = await normalUserRequester1.post('/v1/auth/signout');

      assert.equal(response.status, HttpStatus.CREATED);
      assert.equal(response.body.message, 'Logout successful');
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
        password: '123456789',
      };

      await normalUserRequester1.signin(signinBody);

      const response = await normalUserRequester1.delete('/v1/auth/cancel-account');

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(response.body.message, 'Account cancelled successfully');
    });

    it('should cancel the account of psychologist and succeed', async () => {
      // cancel first psychologist account
      const signinBody: SigninDTO = {
        email: 'mike.test.auth@email.com',
        password: '123456456',
      };

      await psycologistUserRequester.signin(signinBody);

      const response = await psycologistUserRequester.delete('/v1/auth/cancel-account');

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(response.body.message, 'Account cancelled successfully');

      // cancel second psychologist account
      const signinBody2: SigninDTO = {
        email: 'sarah.connor.auth@email.com',
        password: '123456789',
      };

      await psycologistUserRequester2.signin(signinBody2);

      const response2 = await psycologistUserRequester2.delete('/v1/auth/cancel-account');

      assert.equal(response2.status, HttpStatus.OK);
      assert.equal(response2.body.message, 'Account cancelled successfully');
    });

    it('should fail to cancel the account again', async () => {
      const response = await normalUserRequester1.delete('/v1/auth/cancel-account');

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });
  });
});
