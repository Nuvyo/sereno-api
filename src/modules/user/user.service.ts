import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { Modality, User } from '@core/entities/user.entity';
import { QueryData } from '@core/pipes/query.pipe';
import { FindPsychologistDTO } from '@modules/user/user.dto';
import { BaseMessageDTO } from '@core/dtos/generic.dto';
import { Like } from '@core/entities/like.entity';

@Injectable()
export class UserService {
  
  constructor(private readonly dataSource: DataSource) {}

  public async listPsychologists(query: QueryData): Promise<[FindPsychologistDTO[], number]> {
    const queryBuilder = this.dataSource.getRepository(User).createQueryBuilder('user')
      .where('user.psychologist = :psychologist', { psychologist: true })
      // .andWhere('user.validCRP = :validCRP', { validCRP: true })
      .limit(query.take)
      .offset(query.skip)

    if (query.where) {
      if ('modality' in query.where) {
        queryBuilder.andWhere('user.modality = :modality OR user.modality = :both', {
          modality: query.where.modality,
          both: Modality.Both,
        });
      }
    }

    if (query.like) {
      if (query.like) {
        queryBuilder.andWhere('user.name ILIKE :name', { name: `%${query.like}%` });
      }
    }

    return queryBuilder.getManyAndCount();
  }

  public async getPsychologistById(id: string): Promise<FindPsychologistDTO> {
    const user = await this.dataSource.getRepository(User).createQueryBuilder('user')
      .where('user.id = :id', { id })
      .andWhere('user.psychologist = :psychologist', { psychologist: true })
      .leftJoinAndSelect('user.address', 'address')
      .getOneOrFail();

    const likesCount = await this.dataSource.getRepository(Like)
      .count({ where: { toUser: { id: user.id } } });
    
    const userDTO = Object.assign(new FindPsychologistDTO(), user);

    userDTO.likes = likesCount;

    return userDTO;
  }

  public async likePsychologist(psychologistId: string, userId: string): Promise<BaseMessageDTO> {
    if (psychologistId === userId) {
      throw new BadRequestException('user.cannot_like_own_profile');
    }

    await this.dataSource.getRepository(User).findOneOrFail({
      where: { id: psychologistId, psychologist: true },
      select: ['id'],
    });

    const alreadyLiked = await this.dataSource.getRepository(Like).existsBy({ fromUser: { id: userId }, toUser: { id: psychologistId } });

    if (alreadyLiked) {
      await this.dataSource.getRepository(Like).delete({ fromUser: { id: userId }, toUser: { id: psychologistId } });
    } else {
      await this.dataSource.getRepository(Like).save({
        fromUser: { id: userId },
        toUser: { id: psychologistId },
      });
    }

    return {
      message: alreadyLiked ? 'user.user_disliked' : 'user.user_liked',
    };
  }

}
