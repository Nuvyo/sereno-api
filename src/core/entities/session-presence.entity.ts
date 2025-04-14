import { Entity, ManyToOne, RelationId } from 'typeorm';
import { User } from '@core/entities/user.entity';
import { Session } from '@core/entities/session.entity';
import { CustomBaseEntity } from '@core/entities/utils/base.entity';

@Entity({ name: 'session_presences' })
export class SessionPresence extends CustomBaseEntity {

  @RelationId((userSessionPresence: SessionPresence) => userSessionPresence.session)
  sessionId: string;

  @RelationId((userSessionPresence: SessionPresence) => userSessionPresence.user)
  userId: string;

  @ManyToOne(() => Session, (session) => session.presences)
  session: Session;

  @ManyToOne(() => User, (user) => user.sessionPresences)
  user: User;

}
