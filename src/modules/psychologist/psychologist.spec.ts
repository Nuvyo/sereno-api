import * as assert from 'node:assert/strict';
import { describe, before, it, after } from 'node:test';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { createApp } from '../../../test/setup';
import { PsychologistModule } from './psychologist.module';
import { FindPsychologistDTO } from './psychologist.dto';
import Requester from '../../../test/requester';

describe('v1/psychologists', () => {
  let app: INestApplication;
  let normalUserRequester: Requester;
  let psychologistsRequesters: Requester[] = [];

  before(async () => {
    app = await createApp({ imports: [PsychologistModule] });

    normalUserRequester = new Requester(app);
    await normalUserRequester.signupAndSignin({ name: 'John Test' });

    psychologistsRequesters = await createAndSetPsychologistsRequesters(app);
  });

  after(async () => {
    await normalUserRequester.cancelAccount();

    const promises = psychologistsRequesters.map(requester => requester.cancelAccount());

    await Promise.all(promises);

    await app.close();
  });

  describe('/psychologists', () => {
    it('should receive no query param and succeed', async () => {
      const response = await normalUserRequester.get('/v1/psychologists');

      assert.equal(response.status, HttpStatus.OK);

      const psychologists = response.body[0] as FindPsychologistDTO[];

      assert.equal(
        psychologists.some((psychologist) => psychologist.name.startsWith('Tom')),
        true,
      );
      assert.equal(
        psychologists.some((psychologist) => psychologist.name.startsWith('Charles')),
        true,
      );
      assert.equal(
        psychologists.some((psychologist) => psychologist.name.startsWith('Alice')),
        true,
      );
      assert.equal(
        psychologists.some((psychologist) => psychologist.name.startsWith('Emma')),
        true,
      );
      assert.equal(
        psychologists.some((psychologist) => psychologist.name.startsWith('Oliver')),
        true,
      );

      const tom = psychologists.find((psychologist) => psychologist.name.startsWith('Tom'));
      const charles = psychologists.find((psychologist) => psychologist.name.startsWith('Charles'));

      assert.equal(typeof tom?.id, 'string');
      assert.equal(typeof tom?.sessionCost, 'number');
      assert.equal(typeof tom?.bio, 'string');
      assert.equal(tom?.sessionCost, 70);
      assert.equal(charles?.sessionCost, 90);
    });

    it('should receive filter "like=Tom" and succeed', async () => {
      const response = await normalUserRequester.get('/v1/psychologists', {
        like: 'Tom',
      });

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(response.body[0].length, 1);

      const psychologists = response.body[0] as FindPsychologistDTO[];

      assert.equal(
        psychologists.some((psychologist) => psychologist.name.startsWith('Tom')),
        true,
      );
    });

    it('should paginate psychologists with default pagination settings', async () => {
      const response = await normalUserRequester.get('/v1/psychologists', {
        page: 0,
        take: 2,
      });

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(response.body[0].length, 2);
    });

    it('should paginate psychologists with custom page and limit', async () => {
      const response = await normalUserRequester.get('/v1/psychologists', {
        page: 1,
        take: 1,
      });

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(response.body[0].length, 1);
    });

    it('should return empty array for out-of-range page', async () => {
      const response = await normalUserRequester.get('/v1/psychologists', {
        page: 10,
        take: 10,
      });

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(response.body[0].length, 0);
    });

    it('should handle invalid pagination parameters gracefully', async () => {
      const response = await normalUserRequester.get('/v1/psychologists', {
        page: -1,
        take: -3,
      });

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(response.body[0].length >= 0, true);
    });
  });

  describe('/psychologists/:id', () => {
    it('should receive psychologist id and succeed', async () => {
      const response = await normalUserRequester.get(`/v1/psychologists/${psychologistsRequesters[0].userId}`);

      assert.equal(response.status, HttpStatus.OK);

      const psychologist = response.body as FindPsychologistDTO;

      assert.equal(psychologist.name.startsWith('Tom'), true);
      assert.equal(psychologist.id, psychologistsRequesters[0].userId);
      assert.equal(psychologist.sessionCost, 70);
      assert.equal(typeof psychologist.bio, 'string');
      assert.equal(psychologist.bio, 'My name is Tom');
    });

    it('should receive psychologist id and fail', async () => {
      const response = await normalUserRequester.get('/v1/psychologists/b74186fb-c440-4f4c-89a9-8d6fda98f9bc');

      assert.equal(response.status, HttpStatus.NOT_FOUND);
      assert.equal(response.body.message, 'User not found');
    });

    it('should fail to get non-psychologist user', async () => {
      const response = await normalUserRequester.get(`/v1/psychologists/${normalUserRequester.userId}`);

      assert.equal(response.status, HttpStatus.NOT_FOUND);
    });
  });
});

async function createAndSetPsychologistsRequesters(app: INestApplication) {
  const requesters: Requester[] = [];

  for (let i = 0; i < 5; i++) {
    requesters.push(new Requester(app));
  }

  const user1 = {
    name: 'Tom Test',
    email: 'tom.user@email.com',
    psychologist: true,
    public: true,
    crp: '987654321',
    sessionCost: 70,
    bio: 'My name is Tom',
  };
  const user2 = {
    name: 'Charles Test',
    email: 'charles.user@email.com',
    psychologist: true,
    public: true,
    crp: '555555555',
    sessionCost: 90,
    bio: 'My name is Charles',
  };
  const user3 = {
    name: 'Alice Test',
    email: 'alice.user@email.com',
    psychologist: true,
    public: true,
    crp: '111111111',
    sessionCost: 80,
    bio: 'My name is Alice',
  };
  const user4 = {
    name: 'Emma Test',
    email: 'emma.user@email.com',
    psychologist: true,
    public: true,
    crp: '222222222',
    sessionCost: 60,
    bio: 'My name is Emma',
  };
  const user5 = {
    name: 'Oliver Test',
    email: 'oliver.user@email.com',
    psychologist: true,
    public: true,
    crp: '333333333',
    sessionCost: 50,
    bio: 'My name is Oliver',
  };

  await requesters[0].signupAndSignin(user1);
  await requesters[1].signupAndSignin(user2);
  await requesters[2].signupAndSignin(user3);
  await requesters[3].signupAndSignin(user4);
  await requesters[4].signupAndSignin(user5);

  return requesters;
}
