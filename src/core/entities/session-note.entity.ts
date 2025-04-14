import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { Session } from '@core/entities/session.entity';
import { User } from '@core/entities/user.entity';
import { CustomBaseEntity } from '@core/entities/utils/base.entity';

@Entity({ name: 'session_notes' })
export class SessionNote extends CustomBaseEntity {

  @Column({ type: 'json', nullable: true })
  notes: string[];

  @RelationId((sessionNotes: SessionNote) => sessionNotes.session)
  sessionId: string;

  @RelationId((sessionNotes: SessionNote) => sessionNotes.user)
  userId: string;

  @ManyToOne(() => Session, (session) => session.notes)
  session: Session;

  @ManyToOne(() => User, (user) => user.sessionNotes)
  user: User;

}