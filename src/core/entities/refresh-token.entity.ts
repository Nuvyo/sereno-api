import { Column, Entity, JoinColumn, OneToOne, RelationId } from 'typeorm';
import { CustomBaseEntity } from '../entities/utils/base.entity';
import { User } from '../entities/user.entity';

@Entity({ name: 'refresh_tokens' })
export class RefreshToken extends CustomBaseEntity {

  @Column({ type: 'varchar', length: 255, nullable: false })
  token: string;

  @Column({ type: 'timestamp', nullable: false })
  expiresAt: Date;

  @RelationId((refreshToken: RefreshToken) => refreshToken.user)
  userId: string;

  @OneToOne(() => User, (user) => user.refreshToken, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

}
