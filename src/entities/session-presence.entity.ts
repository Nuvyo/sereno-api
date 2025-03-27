import { BaseEntity, Entity, ManyToOne, RelationId } from 'typeorm';
import { User } from '@entities/user.entity';
import { Session } from '@entities/session.entity';

@Entity({ name: 'session_presences' })
export class SessionPresence extends BaseEntity {

  @RelationId((userSessionPresence: SessionPresence) => userSessionPresence.session)
  public session_id: string;

  @RelationId((userSessionPresence: SessionPresence) => userSessionPresence.user)
  public user_id: string;

  @ManyToOne(() => Session, (session) => session.presences)
  public session: Session;

  @ManyToOne(() => User, (user) => user.session_presences)
  public user: User;

}
