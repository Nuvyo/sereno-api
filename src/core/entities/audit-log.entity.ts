import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum AuditAction {
  SIGNUP = 'signup',
  SIGNIN = 'signin',
  SIGNIN_FAILED = 'signin_failed',
  SIGNOUT = 'signout',
  SIGNOUT_ALL = 'signout_all',
  UPDATE_PROFILE = 'update_profile',
  CANCEL_ACCOUNT_REQUESTED = 'cancel_account_requested',
  CANCEL_ACCOUNT = 'cancel_account',
  EMAIL_VERIFICATION = 'email_verification',
  EMAIL_VERIFICATION_RESENT = 'email_verification_resent',
}

@Entity('audit_logs')
export class AuditLog {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 50 })
  action: AuditAction;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ type: 'timestamptz', nullable: false })
  createdAt: Date;

}
