import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class BcryptService {

  private readonly saltOrRounds = 14;

  constructor() {}

  public async hash(value: string): Promise<string> {
    const valueWithPepper = value + process.env.PEPPER;

    return bcrypt.hash(valueWithPepper, this.saltOrRounds);
  }

  public async compare(value: string, hash: string): Promise<boolean> {
    const valueWithPepper = value + process.env.PEPPER;

    return bcrypt.compare(valueWithPepper, hash);
  }

}