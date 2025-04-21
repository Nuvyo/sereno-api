import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { User } from '@core/entities/user.entity';
import { QueryData } from '@core/pipes/query.pipe';
import { FindPsychologistDetailDTO, FindPsychologistDTO } from '@core/dtos/user.dto';
import { PsychologistDetail } from '@core/entities/psychologist-detail.entity';
import { BaseMessageDTO } from '@core/dtos/generic.dto';
import { Like } from '@core/entities/like.entity';

@Injectable()
export class UserService {
  
  constructor(private readonly dataSource: DataSource) {}

  public async listPsychologists(query: QueryData): Promise<FindPsychologistDTO[]> {
    const list: FindPsychologistDTO[] = [];
    const queryBuilder = this.getPsychologistDataQueryBuilder()
      .where('user.isPsychologist = :isPsychologist', { isPsychologist: true });

    if (query.where) {
      if ('inPerson' in query.where) {
        queryBuilder.andWhere('psychologistDetail.inPerson = :inPerson', { inPerson: query.where.inPerson });
      }

      if ('online' in query.where) {
        queryBuilder.andWhere('psychologistDetail.online = :online', { online: query.where.online });
      }
    }

    if (query.like) {
      if (query.like) {
        queryBuilder.andWhere('user.name ILIKE :name', { name: `%${query.like}%` });
      }
    }

    if (query.order) {
      if (query.order.likes) {
        queryBuilder.orderBy('"psychologistDetail_likesCount"', query.order.likes);
      }
    }

    let [rawQuery, params] = queryBuilder.getQueryAndParameters();

    if (query.take) {
      rawQuery += ` LIMIT $${params.length + 1}`;

      params.push(query.take);
    }

    if (query.skip) {
      rawQuery += ` OFFSET $${params.length + 1}`;

      params.push(query.skip);
    }

    const users = await this.dataSource.query(rawQuery, params);

    users.forEach((userRaw: Record<string, any>) => {
      list.push(this.formatPsychologistData(userRaw));
    });

    return list;
  }

  public async getPsychologistById(id: string): Promise<FindPsychologistDTO> {
    const userRaw = await this.getPsychologistDataQueryBuilder()
      .where('user.id = :id', { id })
      .andWhere('user.isPsychologist = :isPsychologist', { isPsychologist: true })
      .getRawOne();

    if (!userRaw) {
      throw new NotFoundException('User not found');
    }

    return this.formatPsychologistData(userRaw);
  }

  public async likePsychologist(psychologistId: string, userId: string): Promise<BaseMessageDTO> {
    if (psychologistId === userId) {
      throw new BadRequestException('You cannot like yourself');
    }

    const psychologist = await this.dataSource.getRepository(User).findOneOrFail({
      where: { id: psychologistId, isPsychologist: true },
      relations: { psychologistDetail: true }
    });
    const alreadyLiked = await this.dataSource.getRepository(Like).existsBy({ psychologistDetail: { id: psychologist.psychologistDetailId }, user: { id: userId } });

    if (alreadyLiked) {
      await this.dataSource.getRepository(Like).delete({ psychologistDetail: { id: psychologist.psychologistDetail.id }, user: { id: userId } });
    } else {
      await this.dataSource.getRepository(Like).save({
        psychologistDetail: { id: psychologist.psychologistDetail.id },
        user: { id: userId }
      });
    }

    return {
      message: alreadyLiked ? 'Like removed successfully' : 'Like added successfully'
    };
  }

  private getDataFromRaw<T>(rawData: Record<string, any>, replaceString: string): T {
    const keys = Object.keys(rawData).filter(key => key.startsWith(replaceString));
    const data = {} as T;

    for (const key of keys) {
      const originalKey = key.replace(replaceString, '') as keyof T;

      data[originalKey] = rawData[key];
    }

    return data;
  }

  private getPsychologistDataQueryBuilder() {
    return this.dataSource.getRepository(User).createQueryBuilder('user')
      .addSelect('psychologistDetail.id', 'psychologistDetail_id')
      .addSelect('psychologistDetail.inPerson', 'psychologistDetail_inPerson')
      .addSelect('psychologistDetail.online', 'psychologistDetail_online')
      .addSelect('psychologistDetail.inPersonPrice', 'psychologistDetail_inPersonPrice')
      .addSelect('psychologistDetail.onlinePrice', 'psychologistDetail_onlinePrice')
      .addSelect('psychologistDetail.bio', 'psychologistDetail_bio')
      .addSelect('psychologistDetail.hasValidRegister', 'psychologistDetail_hasValidRegister')
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(like.id)', 'count')
          .from(Like, 'like')
          .where('like.psychologistDetailId = psychologistDetail.id');
      }, 'psychologistDetail_likesCount')
      .leftJoin('user.psychologistDetail', 'psychologistDetail')
      .loadRelationCountAndMap('psychologistDetail_likesCount', 'psychologistDetail.likes')
  }

  private formatPsychologistData(userRaw: Record<string, any>): FindPsychologistDTO {
    const user = this.getDataFromRaw<User>(userRaw, 'user_');
    const psychologistDetail = this.getDataFromRaw<PsychologistDetail>(userRaw, 'psychologistDetail_');
    const data = new FindPsychologistDTO();

    data.id = user.id;
    data.name = user.name;
    data.psychologistDetail = new FindPsychologistDetailDTO();
    data.psychologistDetail.likes = Number((psychologistDetail as any).likesCount) || 0;
    data.psychologistDetail.inPerson = psychologistDetail.inPerson;
    data.psychologistDetail.online = psychologistDetail.online;
    data.psychologistDetail.inPersonPrice = Number(psychologistDetail.inPersonPrice);
    data.psychologistDetail.onlinePrice = Number(psychologistDetail.onlinePrice);
    data.psychologistDetail.bio = psychologistDetail.bio;
    data.psychologistDetail.hasValidRegister = psychologistDetail.hasValidRegister;

    return data;
  }

}
