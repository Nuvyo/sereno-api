import { Entity, ManyToOne } from 'typeorm';
import { User } from '@core/entities/user.entity';
import { CustomBaseEntity } from '@core/entities/utils/base.entity';

@Entity({ name: 'likes' })
export class Like extends CustomBaseEntity {

  @ManyToOne(() => User, (user) => user.likesGiven, { onDelete: 'CASCADE' })
  public fromUser: User;

  @ManyToOne(() => User, (user) => user.likesReceived, { onDelete: 'CASCADE' })
  public toUser: User;

}
