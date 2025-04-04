import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { Session } from '@entities/session.entity';
import { User } from '@entities/user.entity';
import { CustomBaseEntity } from '@entities/base.entity';

@Entity({ name: 'session_notes' })
export class SessionNote extends CustomBaseEntity {

  @Column({ type: 'json', nullable: true })
  notes: string[];

  @RelationId((sessionNotes: SessionNote) => sessionNotes.session)
  session_id: string;

  @RelationId((sessionNotes: SessionNote) => sessionNotes.user)
  user_id: string;

  @ManyToOne(() => Session, (session) => session.notes)
  session: Session;

  @ManyToOne(() => User, (user) => user.session_notes)
  user: User;

}