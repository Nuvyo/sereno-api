import { Column, Entity, ManyToMany, OneToMany } from 'typeorm';
import { CustomBaseEntity } from '@entities/utils/base.entity';
import { SessionNote } from '@entities/session-note.entity';
import { SessionPresence } from '@entities/session-presence.entity';
import { User } from '@entities/user.entity';

@Entity({ name: 'sessions' })
export class Session extends CustomBaseEntity {

  @Column({ type: 'timestamp', precision: 0, nullable: true })
  start_at: Date;

  @Column({ type: 'timestamp', precision: 0, nullable: true })
  ended_at: Date;

  @ManyToMany(() => User, (user) => user.sessions)
  users: User[];

  @OneToMany(() => SessionPresence, (presence) => presence.session)
  presences: SessionPresence[];

  @OneToMany(() => SessionNote, (sessionNotes) => sessionNotes.session)
  notes: SessionNote[];

}