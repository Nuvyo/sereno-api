import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../../core/entities/user.entity';
import { QueryData } from '../../core/pipes/query.pipe';
import { FindPsychologistDTO } from '../user/user.dto';

@Injectable()
export class UserService {

  constructor(private readonly dataSource: DataSource) {}

  public async listPsychologists(query: QueryData): Promise<[FindPsychologistDTO[], number]> {
    const queryBuilder = this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .where('user.psychologist = :psychologist', { psychologist: true })
      // .andWhere('user.validCRP = :validCRP', { validCRP: true })
      .limit(query.take)
      .offset(query.skip);

    if (query.where) {
      // build filters
    }

    if (query.like) {
      if (query.like) {
        queryBuilder.andWhere('user.name ILIKE :name', { name: `%${query.like}%` });
      }
    }

    return queryBuilder.getManyAndCount();
  }

  public async getPsychologistById(id: string): Promise<FindPsychologistDTO> {
    const user = await this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .andWhere('user.psychologist = :psychologist', { psychologist: true })
      .getOneOrFail();
    const userDTO = Object.assign(new FindPsychologistDTO(), user);

    return userDTO;
  }

}
