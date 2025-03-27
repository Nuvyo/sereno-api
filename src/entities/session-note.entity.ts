import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { Session } from '@entities/session.entity';
import { User } from '@entities/user.entity';

@Entity({ name: 'session_notes' })
export class SessionNote {

  @Column({ type: 'json', nullable: true })
  public notes: string[];

  @RelationId((sessionNotes: SessionNote) => sessionNotes.session)
  public session_id: string;

  @RelationId((sessionNotes: SessionNote) => sessionNotes.user)
  public user_id: string;

  @ManyToOne(() => Session, (session) => session.notes)
  public session: Session;

  @ManyToOne(() => User, (user) => user.session_notes)
  public user: User;

}