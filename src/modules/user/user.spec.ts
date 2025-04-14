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

  before(async () => {
    app = await createApp({
      imports: [UserModule]
    });

    requesterOne = await registerUserDummy(app, 'john@email.com');
    requesterTwo = await registerUserDummy(app, 'tom@email.com');
    requesterThree = await registerUserDummy(app, 'charles@email.com');

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

    // TODO: Update psychologist detail likes to test order by likes
    // TODO: Register Session to test order by session conduct count
  });

  after(async () => {
    await requesterOne.cancelAccount();
    await requesterTwo.cancelAccount();
    await requesterThree.cancelAccount();

    await app.close();
  });

  describe('/psychologists', () => {
    it('should receive no query param and succeed', async () => {
      const response = await requesterOne.get('/v1/users/psychologists');

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(response.body.length >= 3, true);

      const psychologists = response.body as FindPsychologistDTO[];

      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('John')), true);
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Tom')), true);
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Charles')), true);

      const john = psychologists.find(psychologist => psychologist.name.startsWith('John'));
      const tom = psychologists.find(psychologist => psychologist.name.startsWith('Tom'));

      assert.equal(typeof john?.id, 'string');
      assert.equal(typeof john?.psychologistDetail.likes, 'number');
      assert.equal(typeof john?.psychologistDetail.sessionsConducted, 'number');
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
      assert.equal(response.body.length >= 3, true);

      const psychologists = response.body as FindPsychologistDTO[];

      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('John')), true);
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Tom')), true);
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Charles')), true);
    });

    it('should receive filter "inPerson=true" and succeed', async () => {
      const response = await requesterOne.get('/v1/users/psychologists', {
        inPerson: true,
      });

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(response.body.length <= 3, true);

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
      assert.equal(response.body.length === 1, true);

      const psychologists = response.body as FindPsychologistDTO[];

      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('John')), false);
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Tom')), true);
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Charles')), false);
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

    it('should fail to like himself', async () => {
      const response = await requesterOne.put(`/v1/users/psychologists/${requesterOne.userId}/like`);

      assert.equal(response.status, HttpStatus.BAD_REQUEST);
    });

    it('should receive invalid psychologist id and fail', async () => {
      const response = await requesterOne.put('/v1/users/psychologists/b74186fb-c440-4f4c-89a9-8d6fda98f9bc/like');

      assert.equal(response.status, HttpStatus.NOT_FOUND);
    });
  });
});
