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

  @Column({ type: 'varchar', length: 10, nullable: false, default: 'ptbr' })
  language: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  emailVerified: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true, select: false })
  emailVerificationToken: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, select: false })
  cancellationToken: string | null;

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];

}
