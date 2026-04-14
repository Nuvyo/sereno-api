import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class BcryptService {

  constructor() {}

  public async hash(value: string): Promise<string> {
    const valueWithPepper = value + process.env.PEPPER;
    const rounds = process.env.NODE_ENV === 'test' ? 1 : 12;

    return bcrypt.hash(valueWithPepper, rounds);
  }

  public async compare(value: string, hash: string): Promise<boolean> {
    const valueWithPepper = value + process.env.PEPPER;

    return bcrypt.compare(valueWithPepper, hash);
  }

}
