import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class BcryptService {

  constructor() {}

  public async hash(value: string): Promise<string> {
    const rounds = process.env.NODE_ENV === 'test' ? 1 : 12;

    return bcrypt.hash(value + process.env.PEPPER, rounds);
  }

  public async compare(value: string, hash: string): Promise<boolean> {
    return bcrypt.compare(value + process.env.PEPPER, hash);
  }

}
