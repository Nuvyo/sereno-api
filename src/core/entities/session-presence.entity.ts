import { Entity, ManyToOne, RelationId } from 'typeorm';
import { User } from '@core/entities/user.entity';
import { Session } from '@core/entities/session.entity';
import { CustomBaseEntity } from '@core/entities/utils/base.entity';

@Entity({ name: 'session_presences' })
export class SessionPresence extends CustomBaseEntity {

  @RelationId((userSessionPresence: SessionPresence) => userSessionPresence.session)
  session_id: string;

  @RelationId((userSessionPresence: SessionPresence) => userSessionPresence.user)
  user_id: string;

  @ManyToOne(() => Session, (session) => session.presences)
  session: Session;

  @ManyToOne(() => User, (user) => user.session_presences)
  user: User;

}
