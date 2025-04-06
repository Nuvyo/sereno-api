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
        psychologist_detail: true,
      },
      select: {
        id: true,
        name: true,
        psychologist_detail: {
          id: true,
          likes: true,
          in_person: true,
          online: true,
          in_person_price: true,
          online_price: true,
          bio: true,
          has_valid_register: true,
        }
      }
    });
  }

}