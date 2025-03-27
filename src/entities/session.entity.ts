import { Column, Entity, ManyToMany, OneToMany } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import { SessionNote } from '@entities/session-note.entity';
import { SessionPresence } from '@entities/session-presence.entity';
import { User } from '@entities/user.entity';

@Entity({ name: 'sessions' })
export class Session extends BaseEntity {

  @Column({ type: 'datetime', precision: 0, nullable: true })
  public start_at: Date;

  @Column({ type: 'datetime', precision: 0, nullable: true })
  public ended_at: Date;

  @ManyToMany(() => User, (user) => user.sessions)
  public users: User[];

  @OneToMany(() => SessionPresence, (presence) => presence.session)
  public presences: SessionPresence[];

  @OneToMany(() => SessionNote, (sessionNotes) => sessionNotes.session)
  public notes: SessionNote[];

}