import { Column, Entity, JoinColumn, OneToOne, RelationId } from 'typeorm';
import { CustomBaseEntity } from '@core/entities/utils/base.entity';
import { User } from '@core/entities/user.entity';

@Entity({ name: 'refresh_tokens' })
export class RefreshToken extends CustomBaseEntity {

  @Column({ type: 'varchar', length: 255, nullable: false })
  token: string;

  @Column({ type: 'timestamp', nullable: false })
  expires_at: Date;

  @RelationId((refreshToken: RefreshToken) => refreshToken.user)
  user_id: string;

  @OneToOne(() => User, (user) => user.refresh_token, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

}