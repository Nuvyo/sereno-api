import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BcryptService {

  private readonly saltOrRounds = 10;

  constructor() {}

  public async hash(value: string): Promise<string> {
    return bcrypt.hash(value, this.saltOrRounds);
  }

  public async compare(value: string, hash: string): Promise<boolean> {
    return bcrypt.compare(value, hash);
  }


}