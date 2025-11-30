import { Column, Entity, Index, ManyToOne, RelationId } from 'typeorm';
import { CustomBaseEntity } from './utils/base.entity';
import { User } from './user.entity';

@Entity({ name: 'sessions' })
export class Session extends CustomBaseEntity {

  @Column({ type: 'varchar', length: 96, nullable: false, unique: true })
  @Index()
  token: string;

  @Column({ type: 'timestamptz', nullable: false })
  expiresAt: Date;

  @Column({ type: 'integer', nullable: false })
  maxAge: number;

  @RelationId((authSession: Session) => authSession.user)
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

}
