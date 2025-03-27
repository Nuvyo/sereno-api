import { Column, Entity, ManyToMany, OneToMany } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import { SessionNote } from '@entities/session-note.entity';
import { SessionPresence } from '@entities/session-presence.entity';
import { Session } from '@entities/session.entity';

@Entity({ name: 'users' })
export class User extends BaseEntity {

  @Column({ type: 'varchar', length: 255, nullable: false })
  public name: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  public email: string;

  @Column({ type: 'varchar', length: 60, nullable: false })
  public password: string;

  @ManyToMany(() => Session, (session) => session.users)
  public sessions: Session[];

  @ManyToMany(() => SessionPresence, (presence) => presence.user)
  public session_presences: SessionPresence[];

  @OneToMany(() => SessionNote, (sessionNotes) => sessionNotes.user)
  public session_notes: SessionNote[];

}