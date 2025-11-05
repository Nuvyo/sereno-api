import * as assert from 'node:assert/strict';
import { describe, before, it, after } from 'node:test';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { createApp, Requester } from '@test/utils';
import { registerUserDummy } from '@test/dummies';
import { UserModule } from '@modules/user/user.module';
import { FindPsychologistDTO } from '@modules/user/user.dto';
import { SignupDTO } from '@modules/auth/auth.dto';
import { Modality } from '@core/entities/user.entity';

describe('v1/users', () => {
  let app: INestApplication;
  let normalUserRequester: Requester;
  let psychologistRequesterOne: Requester;
  let psychologistRequesterTwo: Requester;
  let psychologistRequesterThree: Requester;
  let psychologistRequesterFour: Requester;
  let psychologistRequesterFive: Requester;

  before(async () => {
    app = await createApp({
      imports: [UserModule]
    });

    normalUserRequester = await registerUserDummy(app, 'john@email.com');
    psychologistRequesterOne = new Requester(app);
    psychologistRequesterTwo = new Requester(app);
    psychologistRequesterThree = new Requester(app);
    psychologistRequesterFour = new Requester(app);
    psychologistRequesterFive = new Requester(app);

    await createPsychologists(psychologistRequesterOne, psychologistRequesterTwo, psychologistRequesterThree, psychologistRequesterFour, psychologistRequesterFive);
  });

  after(async () => {
    await normalUserRequester.cancelAccount();
    await psychologistRequesterOne.cancelAccount();
    await psychologistRequesterTwo.cancelAccount();
    await psychologistRequesterThree.cancelAccount();
    await psychologistRequesterFour.cancelAccount();
    await psychologistRequesterFive.cancelAccount();

    await app.close();
  });

  describe('/psychologists', () => {
    it('should receive no query param and succeed', async () => {
      const response = await normalUserRequester.get('/v1/users/psychologists');

      assert.equal(response.status, HttpStatus.OK);

      const psychologists = response.body[0] as FindPsychologistDTO[];

      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Tom')), true);
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Charles')), true);
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Alice')), true);
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Emma')), true);
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Oliver')), true);

      const tom = psychologists.find(psychologist => psychologist.name.startsWith('Tom'));
      const charles = psychologists.find(psychologist => psychologist.name.startsWith('Charles'));

      assert.equal(typeof tom?.id, 'string');
      assert.equal(typeof tom?.modality, 'string');
      assert.equal(typeof tom?.sessionCost, 'number');
      assert.equal(typeof tom?.bio, 'string');

      assert.equal(tom?.modality, Modality.Online);
      assert.equal(tom?.sessionCost, 70);

      assert.equal(charles?.modality, Modality.Both);
      assert.equal(charles?.sessionCost, 90);
    });

    it('should receive filter "modality=online" and succeed', async () => {
      const response = await normalUserRequester.get('/v1/users/psychologists', {
        modality: Modality.Online,
      });

      assert.equal(response.status, HttpStatus.OK);

      const psychologists = response.body[0] as FindPsychologistDTO[];

      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Tom')), true);
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Charles')), true); // Both includes online
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Oliver')), true);
    });

    it('should receive filter "modality=in_person" and succeed', async () => {
      const response = await normalUserRequester.get('/v1/users/psychologists', {
        modality: Modality.InPerson,
      });

      assert.equal(response.status, HttpStatus.OK);

      const psychologists = response.body[0] as FindPsychologistDTO[];

      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Tom')), false);
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Charles')), true); // Both includes in_person
      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Alice')), true);
    });

    it('should receive filter "like=Tom" and succeed', async () => {
      const response = await normalUserRequester.get('/v1/users/psychologists', {
        like: 'Tom',
      });

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(response.body[0].length, 1);

      const psychologists = response.body[0] as FindPsychologistDTO[];

      assert.equal(psychologists.some(psychologist => psychologist.name.startsWith('Tom')), true);
    });

    it('should paginate psychologists with default pagination settings', async () => {
      const response = await normalUserRequester.get('/v1/users/psychologists', {
        page: 0,
        take: 2,
      });

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(response.body[0].length, 2);
    });

    it('should paginate psychologists with custom page and limit', async () => {
      const response = await normalUserRequester.get('/v1/users/psychologists', {
        page: 1,
        take: 1,
      });

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(response.body[0].length, 1);
    });

    it('should return empty array for out-of-range page', async () => {
      const response = await normalUserRequester.get('/v1/users/psychologists', {
        page: 10,
        take: 10,
      });

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(response.body[0].length, 0);
    });

    it('should handle invalid pagination parameters gracefully', async () => {
      const response = await normalUserRequester.get('/v1/users/psychologists', {
        page: -1,
        take: -3,
      });

      assert.equal(response.status, HttpStatus.OK);
      assert.equal(response.body[0].length >= 0, true);
    });
  });

  describe('/psychologists/:id', () => {
    it('should receive psychologist id and succeed', async () => {
      const response = await normalUserRequester.get(`/v1/users/psychologists/${psychologistRequesterOne.userId}`);

      assert.equal(response.status, HttpStatus.OK);
      
      const psychologist = response.body as FindPsychologistDTO;

      assert.equal(psychologist.name.startsWith('Tom'), true);
      assert.equal(psychologist.id, psychologistRequesterOne.userId);
      assert.equal(psychologist.modality, Modality.Online);
      assert.equal(psychologist.sessionCost, 70);
      assert.equal(typeof psychologist.bio, 'string');
      assert.equal(psychologist.bio, 'My name is Tom');
    });

    it('should receive psychologist id and fail', async () => {
      const response = await normalUserRequester.get('/v1/users/psychologists/b74186fb-c440-4f4c-89a9-8d6fda98f9bc');
      const message = ['Usuário não encontrado'];
      assert.equal(response.status, HttpStatus.NOT_FOUND);
      assert.equal(message.includes(response.body.message), true);
    });

    it('should fail to get non-psychologist user', async () => {
      const response = await normalUserRequester.get(`/v1/users/psychologists/${normalUserRequester.userId}`);

      assert.equal(response.status, HttpStatus.NOT_FOUND);
    });
  });
});

async function createPsychologists(requesterOne: Requester, requesterTwo: Requester, requesterThree: Requester, requesterFour: Requester, requesterFive: Requester) {
    const signupBodyOne = {
      name: 'Tom Test',
      email: 'tom.user@email.com',
      password: '12345678',
      passwordConfirmation: '12345678',
      psychologist: true,
      public: true,
      crp: '987654321',
      modality: Modality.Online,
      sessionCost: 70,
      bio: 'My name is Tom',
    } as SignupDTO;
    await requesterOne.post('/v1/auth/signup', signupBodyOne);
    await requesterOne.signin({ email: 'tom.user@email.com', password: '12345678' });

    const signupBodyTwo = {
      name: 'Charles Test',
      email: 'charles.user@email.com',
      password: '12345678',
      passwordConfirmation: '12345678',
      psychologist: true,
      public: true,
      crp: '555555555',
      modality: Modality.Both,
      sessionCost: 90,
      bio: 'My name is Charles',
    } as SignupDTO;
    await requesterTwo.post('/v1/auth/signup', signupBodyTwo);
    await requesterTwo.signin({ email: 'charles.user@email.com', password: '12345678' });

    const signupBodyThree = {
      name: 'Alice Test',
      email: 'alice.user@email.com',
      password: '12345678',
      passwordConfirmation: '12345678',
      psychologist: true,
      public: true,
      crp: '111111111',
      modality: Modality.Both,
      sessionCost: 80,
      bio: 'My name is Alice',
    } as SignupDTO;
    await requesterThree.post('/v1/auth/signup', signupBodyThree);
    await requesterThree.signin({ email: 'alice.user@email.com', password: '12345678' });

    const signupBodyFour = {
      name: 'Emma Test',
      email: 'emma.user@email.com',
      password: '12345678',
      passwordConfirmation: '12345678',
      psychologist: true,
      public: true,
      crp: '222222222',
      modality: Modality.Both,
      sessionCost: 60,
      bio: 'My name is Emma',
    } as SignupDTO;
    await requesterFour.post('/v1/auth/signup', signupBodyFour);
    await requesterFour.signin({ email: 'emma.user@email.com', password: '12345678' });

    const signupBodyFive = {
      name: 'Oliver Test',
      email: 'oliver.user@email.com',
      password: '12345678',
      passwordConfirmation: '12345678',
      psychologist: true,
      public: true,
      crp: '333333333',
      modality: Modality.Online,
      sessionCost: 50,
      bio: 'My name is Oliver',
    } as SignupDTO;
    await requesterFive.post('/v1/auth/signup', signupBodyFive);
    await requesterFive.signin({ email: 'oliver.user@email.com', password: '12345678' });
}
