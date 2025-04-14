import { SignupDTO } from '@core/dtos/auth.dto';
import { INestApplication } from '@nestjs/common';
import { Requester } from '@test/utils';

export async function registerUserDummy(app: INestApplication, email: string): Promise<Requester> {
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
  const requester = new Requester(app);
  const names = ['Dummy', 'Junny', 'Sunny', 'Bunny', 'Gunny', 'Punny', 'Runny', 'Tunny'];
  const emailName = email.split('@')[0];
  const name = `${capitalize(emailName)} ${names[Math.floor(Math.random() * names.length)]}`;
  const password = '123456456';
  const body: SignupDTO = {
    email,
    name,
    password,
    passwordConfirmation: '123456456',
    isPsychologist: true,
  };

  await requester.post('/v1/auth/signup', body);
  await requester.signin({
    email,
    password,
  });

  return requester;
}
