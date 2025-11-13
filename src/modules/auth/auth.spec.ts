import * as assert from 'node:assert/strict';
import { describe, before, it, after } from 'node:test';
import {
  MeResponseDTO,
  RefreshTokenDTO,
  RefreshTokensResponseDTO,
  SigninDTO,
  SigninResponseDTO,
  SignupDTO,
} from '../auth/auth.dto';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { createApp, Requester } from '../../../test/utils';
import { Specialization } from '../../core/entities/user.entity';

describe('v1/auth', () => {
  let app: INestApplication;
  let normalUserRequester1: Requester;
  let psycologistUserRequester1: Requester;
  let psycologistUserRequester2: Requester;
  let psycologistUserRequester3: Requester;

  before(async () => {
    app = await createApp();
    normalUserRequester1 = new Requester(app);
    psycologistUserRequester1 = new Requester(app);
    psycologistUserRequester2 = new Requester(app);
    psycologistUserRequester3 = new Requester(app);
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
        photo: 'https://test.example/photo.jpg',
        name: 'Mike Wool Test',
        email: 'mike.test.auth@email.com',
        password: '123456456',
        passwordConfirmation: '123456456',
        psychologist: true,
        public: true,
        crp: '123456-12',
        specializations: [Specialization.Ansiety, Specialization.Depression],
        sessionCost: 200.0,
        bio: 'Experienced psychologist with a focus on cognitive behavioral therapy.',
      } as SignupDTO;
      const response = await psycologistUserRequester2.post('/v1/auth/signup', body);

      if (response.status !== HttpStatus.CREATED) {
        console.log('DEBUG signup public failure:', response.body);
      }

      assert.equal(response.status, HttpStatus.CREATED);
      assert.equal(typeof response.body.message, 'string');
    });

    it('should receive a body of public psychologist user and succeed', async () => {
      const body = {
        photo: 'https://example.com/photo.jpg',
        name: 'Dr. Sarah Connor',
        email: 'sarah.connor.auth@email.com',
        password: '123456789',
        passwordConfirmation: '123456789',
        psychologist: true,
        public: true,
        crp: '12345-12',
        sessionCost: 150.0,
        bio: 'Experienced psychologist specialized in cognitive behavioral therapy.',
      } as SignupDTO;
      const response = await psycologistUserRequester3.post('/v1/auth/signup', body);
      if (response.status !== HttpStatus.CREATED) {
        console.log('DEBUG signup private failure:', response.body);
      }
      assert.equal(response.status, HttpStatus.CREATED);
    });

    it('should receive a body of a private psychologist user and succeed', async () => {
      const body = {
        name: 'Sofie Test',
        email: 'sofie.test.auth@email.com',
        password: '123456456',
        passwordConfirmation: '123456456',
        psychologist: true,
        public: false,
      } as SignupDTO;
      const response = await psycologistUserRequester3.post('/v1/auth/signup', body);

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
      assert.match(response.body.message, /Email already in use/);
    });

    it('should fail when public psychologist is missing required fields', async () => {
      const body = {
        name: 'Dr. Incomplete',
        email: 'incomplete@email.com',
        password: '123456789',
        passwordConfirmation: '123456789',
        psychologist: true,
        public: true,
      } as SignupDTO;
      const response = await normalUserRequester1.post('/v1/auth/signup', body);

      assert.equal(response.status, HttpStatus.BAD_REQUEST);
    });

    it('should fail when public psychologist is missing sessionCost', async () => {
      const body = {
        name: 'Dr. No SessionCost',
        email: 'no.sessioncost@email.com',
        password: '123456789',
        passwordConfirmation: '123456789',
        psychologist: true,
        public: true,
        crp: '123456-12',
        bio: 'Test',
      } as SignupDTO;
      const response = await normalUserRequester1.post('/v1/auth/signup', body);

      assert.equal(response.status, HttpStatus.BAD_REQUEST);
      assert.match(response.body.message, /Session cost is required/);
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
      assert.match(response.body.message, /Invalid credentials/);
    });

    it('should receive a body with invalid password and fail', async () => {
      const body: SigninDTO = {
        email: 'john.test.auth@email.com',
        password: '12345678',
      };
      const response = await normalUserRequester1.post('/v1/auth/signin', body);

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
      assert.match(response.body.message, /Invalid credentials/);
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
        assert.equal(key in new SigninResponseDTO(), true);
      });

      normalUserRequester1.setTokens(response.body.accessToken, response.body.refreshToken);
    });

    it('should receive a body of a psychologist user and succeed', async () => {
      const body: SigninDTO = {
        email: 'mike.test.auth@email.com',
        password: '123456456',
      };
      const response = await psycologistUserRequester1.post('/v1/auth/signin', body);

      assert.equal(response.status, HttpStatus.CREATED);
      assert.equal(typeof response.body.accessToken, 'string');
      assert.equal(typeof response.body.refreshToken, 'string');
      assert.equal(typeof response.body.userId, 'string');

      Object.keys(response.body).forEach((key) => {
        assert.notEqual(key, 'password');
        assert.notEqual(key, 'passwordConfirmation');
        assert.equal(key in new SigninResponseDTO(), true);
      });

      psycologistUserRequester1.setTokens(response.body.accessToken, response.body.refreshToken);

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
        assert.equal(key in new SigninResponseDTO(), true);
      });

      psycologistUserRequester2.setTokens(response2.body.accessToken, response2.body.refreshToken);

      const body3: SigninDTO = {
        email: 'sofie.test.auth@email.com',
        password: '123456456',
      };
      const response3 = await psycologistUserRequester3.post('/v1/auth/signin', body3);

      assert.equal(response3.status, HttpStatus.CREATED);
      assert.equal(typeof response3.body.accessToken, 'string');
      assert.equal(typeof response3.body.refreshToken, 'string');
      assert.equal(typeof response3.body.userId, 'string');

      Object.keys(response3.body).forEach((key) => {
        assert.notEqual(key, 'password');
        assert.notEqual(key, 'passwordConfirmation');
        assert.equal(key in new SigninResponseDTO(), true);
      });

      psycologistUserRequester3.setTokens(response3.body.accessToken, response3.body.refreshToken);
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
        assert.equal(key in new RefreshTokensResponseDTO(), true);
      });

      normalUserRequester1.setTokens(response.body.accessToken, response.body.refreshToken);
    });

    it('should not find the refresh token and fail', async () => {
      const body: RefreshTokenDTO = { refreshToken: '0de903fb-cd85-4fc8-b648-f625f994a515' };
      const response = await normalUserRequester1.post('/v1/auth/refresh', body);

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
      assert.match(response.body.message, /Invalid refresh token/);
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

    it('should get the psychologist user data and succeed', async () => {
      const response = await psycologistUserRequester1.get('/v1/auth/me');

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(typeof response.body.id, 'string');
      assert.equal(typeof response.body.name, 'string');
      assert.equal(typeof response.body.email, 'string');
      assert.equal(typeof response.body.crp, 'string');
      assert.equal(typeof response.body.sessionCost, 'number');
      assert.equal(typeof response.body.bio, 'string');

      Object.keys(response.body).forEach((key) => {
        assert.notEqual(key, 'password');
        assert.notEqual(key, 'passwordConfirmation');
        assert.equal(key in new MeResponseDTO(), true);
      });
    });
  });

  describe('[PUT] /me', () => {
    it('should fail if psychologist tries to become public without crp', async () => {
      const updateBody = {
        public: true,
        photo: 'https://example.com/photo.jpg',
        sessionCost: 100,
        bio: 'Test',
      };
      const response = await psycologistUserRequester3.put('/v1/auth/me', updateBody);

      assert.equal(response.status, HttpStatus.BAD_REQUEST);
      assert.match(response.body.message, /CRP is required/);
    });

    it('should fail if psychologist tries to become public without sessionCost', async () => {
      const updateBody = {
        public: true,
        crp: '231331564',
        bio: 'Test',
      };
      const response = await psycologistUserRequester3.put('/v1/auth/me', updateBody);

      assert.equal(response.status, HttpStatus.BAD_REQUEST);
      assert.match(response.body.message, /Session cost is required/);
    });

    it('should update the user name and photo successfully', async () => {
      const updateBody = { name: 'Updated Name', photo: 'https://example.com/updated-photo.jpg' };
      const response = await normalUserRequester1.put('/v1/auth/me', updateBody);

      assert.equal(response.status, HttpStatus.OK);
      assert.match(response.body.message, /Profile updated successfully/);

      const meRes = await normalUserRequester1.get('/v1/auth/me');

      assert.equal(meRes.body.name, 'Updated Name');
      assert.equal(meRes.body.photo, 'https://example.com/updated-photo.jpg');
    });

    it('should update the public field for psychologist', async () => {
      const updateBody = {
        public: true,
        crp: '999999-99',
        sessionCost: 100,
        bio: 'Test',
      };
      const response = await psycologistUserRequester1.put('/v1/auth/me', updateBody);

      assert.equal(response.status, HttpStatus.OK);
      assert.match(response.body.message, /Profile updated successfully/);
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
        password: '123456789',
      };

      await normalUserRequester1.signin(signinBody);

      const response = await normalUserRequester1.delete('/v1/auth/cancel-account');

      assert.equal(response.status, HttpStatus.OK);
      assert.match(response.body.message, /Account cancelled successfully/);
    });

    it('should cancel the account of psychologist and succeed', async () => {
      const signinBody: SigninDTO = {
        email: 'mike.test.auth@email.com',
        password: '123456456',
      };

      await psycologistUserRequester1.signin(signinBody);

      const response = await psycologistUserRequester1.delete('/v1/auth/cancel-account');

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(response.body.message, 'Account cancelled successfully');

      const signinBody2: SigninDTO = {
        email: 'sarah.connor.auth@email.com',
        password: '123456789',
      };

      await psycologistUserRequester2.signin(signinBody2);

      const response2 = await psycologistUserRequester2.delete('/v1/auth/cancel-account');

      assert.equal(response2.status, HttpStatus.OK);
      assert.match(response2.body.message, /Account cancelled successfully/);

      const signinBody3: SigninDTO = {
        email: 'sofie.test.auth@email.com',
        password: '123456456',
      };

      await psycologistUserRequester3.signin(signinBody3);

      const response3 = await psycologistUserRequester3.delete('/v1/auth/cancel-account');

      assert.equal(response3.status, HttpStatus.OK);
      assert.match(response3.body.message, /Account cancelled successfully/);
    });

    it('should fail to cancel the account again', async () => {
      const response = await normalUserRequester1.delete('/v1/auth/cancel-account');

      assert.equal(response.status, HttpStatus.UNAUTHORIZED);
    });
  });
});
