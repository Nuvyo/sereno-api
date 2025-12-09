import { Column, Entity, OneToMany } from 'typeorm';
import { CustomBaseEntity } from '../entities/utils/base.entity';
import { Session } from './session.entity';

@Entity({ name: 'users' })
export class User extends CustomBaseEntity {

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 60, nullable: false, select: false })
  password: string;

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];

}
