import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { CustomBaseEntity } from '../entities/utils/base.entity';
import { User } from '../entities/user.entity';

@Entity({ name: 'access_tokens' })
export class AccessToken extends CustomBaseEntity {
  
  @Column({ type: 'varchar', length: 255, nullable: false })
  token: string;

  @RelationId((tokenBlocklist: AccessToken) => tokenBlocklist.user)
  userId: string;

  @ManyToOne(() => User, (user) => user.accessToken, { onDelete: 'CASCADE' })
  user: User;

}
