import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { CustomBaseEntity } from '@entities/base.entity';
import { User } from '@entities/user.entity';

@Entity({ name: 'access_tokens' })
export class AccessToken extends CustomBaseEntity {
  
  @Column({ type: 'varchar', length: 255, nullable: false })
  token: string;

  @RelationId((tokenBlocklist: AccessToken) => tokenBlocklist.user)
  user_id: string;

  @ManyToOne(() => User, (user) => user.access_token, { onDelete: 'CASCADE' })
  user: User;

}