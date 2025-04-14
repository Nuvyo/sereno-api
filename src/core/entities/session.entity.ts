import { Column, Entity, ManyToMany, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { CustomBaseEntity } from '@core/entities/utils/base.entity';
import { SessionNote } from '@core/entities/session-note.entity';
import { SessionPresence } from '@core/entities/session-presence.entity';
import { User } from '@core/entities/user.entity';
import { PsychologistDetail } from './psychologist-detail.entity';

@Entity({ name: 'sessions' })
export class Session extends CustomBaseEntity {

  @Column({ type: 'timestamp', precision: 0, nullable: true })
  startAt: Date;

  @Column({ type: 'timestamp', precision: 0, nullable: true })
  endedAt: Date;

  @RelationId((session: Session) => session.psychologistDetail)
  psychologistDetailId: string;

  @ManyToMany(() => User, (user) => user.sessions)
  users: User[];

  @ManyToOne(() => PsychologistDetail, (detail) => detail.sessionsConducted)
  psychologistDetail: PsychologistDetail;

  @OneToMany(() => SessionPresence, (presence) => presence.session)
  presences: SessionPresence[];

  @OneToMany(() => SessionNote, (sessionNotes) => sessionNotes.session)
  notes: SessionNote[];

}