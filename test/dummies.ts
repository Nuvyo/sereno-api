import { SignupDTO } from '../src/modules/auth/auth.dto';
import { INestApplication } from '@nestjs/common';
import { Requester } from './utils';

export async function registerUserDummy(
  app: INestApplication,
  email: string,
  psychologist: boolean = false,
): Promise<Requester> {
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
  const requester = new Requester(app);
  const names = ['Dummy', 'Junny', 'Sunny', 'Bunny', 'Gunny', 'Punny', 'Runny', 'Tunny'];
  const emailName = email.split('@')[0];
  const name = `${capitalize(emailName)} ${names[Math.floor(Math.random() * names.length)]}`;
  const password = '123456456';
  const body = {
    email,
    name,
    password,
    passwordConfirmation: '123456456',
    psychologist,
  } as SignupDTO;

  await requester.post('/v1/auth/signup', body);
  await requester.signin({
    email,
    password,
  });

  return requester;
}
