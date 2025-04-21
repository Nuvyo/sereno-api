import * as assert from 'node:assert/strict';
import { describe, before, it, after } from 'node:test';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { createApp, Requester } from '@test/utils';
import { registerUserDummy } from '@test/dummies';
import { UserModule } from '@modules/user/user.module';
import { FindPsychologistDTO } from '@core/dtos/user.dto';

describe('v1/users', () => {
  let app: INestApplication;
  let requesterOne: Requester;
  let requesterTwo: Requester;
  let requesterThree: Requester;
  let requesterFour: Requester;
  let requesterFive: Requester;
  let requesterSix: Requester;

  before(async () => {
    app = await createApp({
      imports: [UserModule]
    });

    requesterOne = await registerUserDummy(app, 'john@email.com');
    requesterTwo = await registerUserDummy(app, 'tom@email.com');
    requesterThree = await registerUserDummy(app, 'charles@email.com');
    requesterFour = await registerUserDummy(app, 'alice@email.com');
    requesterFive = await registerUserDummy(app, 'emma@email.com');
    requesterSix = await registerUserDummy(app, 'oliver@email.com');

    await requesterOne.put('/v1/auth/psychologist-detail', {
      registerNumber: '123456789',
      online: true,
      inPerson: true,
      onlinePrice: 100,
      inPersonPrice: 100,
      bio: 'My name is John',
    });

    await requesterTwo.put('/v1/auth/psychologist-detail', {
      registerNumber: '987654321',
      online: true,
      onlinePrice: 70,
      bio: 'My name is Tom',
    });

    await requesterThree.put('/v1/auth/psychologist-detail', {
      registerNumber: '555555555',
      online: true,
      inPerson: true,
      onlinePrice: 90,
      inPersonPrice: 95,
      bio: 'My name is Charles',
    });

    await requesterFour.put('/v1/auth/psychologist-detail', {
      registerNumber: '111111111',
      online: true,
      inPerson: true,
      onlinePrice: 80,
      inPersonPrice: 85,
      bio: 'My name is Alice',
    });

    await requesterFive.put('/v1/auth/psychologist-detail', {
      registerNumber: '222222222',
      online: true,
      inPerson: true,
      onlinePrice: 60,
      bio: 'My name is Emma',
    });

    await requesterSix.put('/v1/auth/psychologist-detail', {
      registerNumber: '333333333',
      online: true,
      inPerson: false,
      onlinePrice: 50,
      bio: 'My name is Oliver',
    });

    // TODO: Register Session to test order by session conduct count
  });

  after(async () => {
    await requesterOne.cancelAccount();
    await requesterTwo.cancelAccount();
    await requesterThree.cancelAccount();
    await requesterFour.cancelAccount();
    await requesterFive.cancelAccount();
    await requesterSix.cancelAccount();

    await app.close();
  });

  describe('/psychologists/:id/like', () => {
    it('should receive psychologist id and add like successfully', async () => {
      const response = await requesterOne.put(`/v1/users/psychologists/${requesterTwo.userId}/like`);
      const psychlogistResponse = await requesterOne.get(`/v1/users/psychologists/${requesterTwo.userId}`);

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(psychlogistResponse.body.psychologistDetail.likes, 1);
    });

    it('should receive psychologist id and remove like successfully', async () => {
      const response = await requesterOne.put(`/v1/users/psychologists/${requesterTwo.userId}/like`);
      const psychlogistResponse = await requesterOne.get(`/v1/users/psychologists/${requesterTwo.userId}`);

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(psychlogistResponse.body.psychologistDetail.likes, 0);
    });

    it('should receive psychologist id and add like successfully again', async () => {
      const response = await requesterOne.put(`/v1/users/psychologists/${requesterTwo.userId}/like`);
      const psychlogistResponse = await requesterOne.get(`/v1/users/psychologists/${requesterTwo.userId}`);

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(psychlogistResponse.body.psychologistDetail.likes, 1);
    });

    it('should fail to like himself', async () => {
      const response = await requesterOne.put(`/v1/users/psychologists/${requesterOne.userId}/like`);

      assert.equal(response.status, HttpStatus.BAD_REQUEST);
    });

    it('should receive invalid psychologist id and fail', async () => {
      const response = await requesterOne.put('/v1/users/psychologists/b74186fb-c440-4f4c-89a9-8d6fda98f9bc/like');

      assert.equal(response.status, HttpStatus.NOT_FOUND);
    });
  });

  describe('/psychologists', () => {
    it('should receive no query param and succeed', async () => {
      const response = await requesterOne.get('/v1/users/psychologists');

      assert.equal(response.status, HttpStatus.OK);

      const psychologists = response.body as FindPsychologistDTO[];

      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('John')), true);
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Tom')), true);
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Charles')), true);
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Alice')), true);
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Emma')), true);
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Oliver')), true);

      const john = psychologists.find(psychologist => psychologist.name.startsWith('John'));
      const tom = psychologists.find(psychologist => psychologist.name.startsWith('Tom'));

      assert.equal(typeof john?.id, 'string');
      assert.equal(typeof john?.psychologistDetail.likes, 'number');
      assert.equal(typeof john?.psychologistDetail.inPerson, 'boolean');
      assert.equal(typeof john?.psychologistDetail.online, 'boolean');
      assert.equal(typeof john?.psychologistDetail.inPersonPrice, 'number');
      assert.equal(typeof john?.psychologistDetail.onlinePrice, 'number');
      assert.equal(typeof john?.psychologistDetail.bio, 'string');
      assert.equal(typeof john?.psychologistDetail.hasValidRegister, 'boolean');

      assert.equal(john?.psychologistDetail.inPerson, true);
      assert.equal(john?.psychologistDetail.online, true);
      assert.equal(john?.psychologistDetail.inPersonPrice, 100);
      assert.equal(john?.psychologistDetail.onlinePrice, 100);

      assert.equal(tom?.psychologistDetail.inPerson, false);
      assert.equal(tom?.psychologistDetail.online, true);
      assert.equal(tom?.psychologistDetail.inPersonPrice, null);
      assert.equal(tom?.psychologistDetail.onlinePrice, 70);
    });

    it('should receive filter "online=true" and succeed', async () => {
      const response = await requesterOne.get('/v1/users/psychologists', {
        online: true,
      });

      assert.equal(response.status, HttpStatus.OK);

      const psychologists = response.body as FindPsychologistDTO[];

      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('John')), true);
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Tom')), true);
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Charles')), true);
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Alice')), true);
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Emma')), true);
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Oliver')), true);
    });

    it('should receive filter "inPerson=true" and succeed', async () => {
      const response = await requesterOne.get('/v1/users/psychologists', {
        inPerson: true,
      });

      assert.equal(response.status, HttpStatus.OK);

      const psychologists = response.body as FindPsychologistDTO[];

      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('John')), true);
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Tom')), false);
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Charles')), true);
    });

    it('should receive filter "inPerson=false" and succeed', async () => {
      const response = await requesterOne.get('/v1/users/psychologists', {
        inPerson: false,
      });

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(response.body.length === 2, true);

      const psychologists = response.body as FindPsychologistDTO[];

      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('John')), false);
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Tom')), true);
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Charles')), false);
    });

    it('should receive order by "likes DESC" and succeed', async () => {
      const response = await requesterOne.get('/v1/users/psychologists', {
        order: ['-likes'],
      });

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(response.body.length >= 3, true);

      const psychologists = response.body as FindPsychologistDTO[];

      assert.equal(psychologists[0].name.startsWith('Tom'), true);
    });

    it('should receive order by "likes ASC" and succeed', async () => {
      const response = await requesterOne.get('/v1/users/psychologists', {
        order: ['likes'],
      });

      assert.equal(response.status, HttpStatus.OK);

      const psychologists = response.body as FindPsychologistDTO[];

      assert.equal(psychologists[psychologists.length - 1].name.startsWith('Tom'), true);
    });

    it('should receive filter "like=Tom" and succeed', async () => {
      const response = await requesterOne.get('/v1/users/psychologists', {
        like: 'Tom',
      });

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(response.body.length === 1, true);

      const psychologists = response.body as FindPsychologistDTO[];

      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Tom')), true);
    });

    it('should paginate psychologists with default pagination settings', async () => {
      const response = await requesterOne.get('/v1/users/psychologists', {
        page: 0,
        take: 2,
      });

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(response.body.length, 2);
    });

    it('should paginate psychologists with custom page and limit', async () => {
      const response = await requesterOne.get('/v1/users/psychologists', {
        page: 1,
        take: 1,
      });

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(response.body.length, 1);

      const psychologists = response.body as FindPsychologistDTO[];

      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Tom')), true);
    });

    it('should return empty array for out-of-range page', async () => {
      const response = await requesterOne.get('/v1/users/psychologists', {
        page: 1,
        take: 10,
      });

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(response.body.length, 0);
    });

    it('should handle invalid pagination parameters gracefully', async () => {
      const response = await requesterOne.get('/v1/users/psychologists', {
        page: -1,
        take: -3,
      });

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(response.body.length >= 3, true);
    });
  });

  describe('/psychologists/:id', () => {
    it('should receive psychologist id and succeed', async () => {
      const response = await requesterOne.get(`/v1/users/psychologists/${requesterTwo.userId}`);

      assert.equal(response.status, HttpStatus.OK);
      
      const psychologist = response.body as FindPsychologistDTO;

      assert.equal(psychologist.name.startsWith('Tom'), true);
      assert.equal(psychologist.id, requesterTwo.userId);
      assert.equal(psychologist?.psychologistDetail.inPerson, false);
      assert.equal(psychologist?.psychologistDetail.online, true);
      assert.equal(psychologist?.psychologistDetail.inPersonPrice, null);
      assert.equal(psychologist?.psychologistDetail.onlinePrice, 70);
    });

    it('should receive psychologist id and fail', async () => {
      const response = await requesterOne.get('/v1/users/psychologists/b74186fb-c440-4f4c-89a9-8d6fda98f9bc');

      assert.equal(response.status, HttpStatus.NOT_FOUND);
    });
  });
});
