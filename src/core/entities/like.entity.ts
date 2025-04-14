import { Entity, ManyToOne } from 'typeorm';
import { User } from '@core/entities/user.entity';
import { CustomBaseEntity } from '@core/entities/utils/base.entity';
import { PsychologistDetail } from '@core/entities/psychologist-detail.entity';

@Entity({ name: 'likes' })
export class Like extends CustomBaseEntity {

  @ManyToOne(() => PsychologistDetail, (detail) => detail.likes, { onDelete: 'CASCADE' })
  public psychologistDetail: PsychologistDetail;

  @ManyToOne(() => User, (user) => user.likesGiven, { onDelete: 'SET NULL' })
  public user: User;

}