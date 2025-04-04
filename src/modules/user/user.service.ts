import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '@entities/user.entity';

@Injectable()
export class UserService {

  constructor(private readonly dataSource: DataSource) {}

  public getPsychologists() {
    return this.dataSource.getRepository(User).find({
      where: {
        is_psychologist: true,
      },
      relations: {
        psychologist_config: true,
      },
    });
  }

}