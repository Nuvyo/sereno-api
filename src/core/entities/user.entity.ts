import { Column, Entity, OneToMany, OneToOne } from 'typeorm';
import { ChatMessage } from '../entities/chat-message.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { AccessToken } from '../entities/access-token.entity';
import { CustomBaseEntity } from '../entities/utils/base.entity';
import { ColumnDecimalTransformer } from '../entities/utils/transformers';

export enum Specialization {
  Ansiety = 'anxiety',
  Depression = 'depression',
  Relationship = 'relationship',
  Trauma = 'trauma',
  ChildPsychology = 'child_psychology',
  Addiction = 'addiction',
  StressManagement = 'stress_management'
}

@Entity({ name: 'users' })
export class User extends CustomBaseEntity {

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 60, nullable: false, select: false })
  password: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  photo: string;

  @OneToMany(() => ChatMessage, (chatMessage) => chatMessage.fromUser)
  messagesSent: ChatMessage[];

  @OneToMany(() => ChatMessage, (chatMessage) => chatMessage.toUser)
  messagesReceived: ChatMessage[];

  @OneToOne(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshToken: RefreshToken;

  @OneToOne(() => AccessToken, (blockedToken) => blockedToken.user)
  accessToken: AccessToken;

  // Psychologist-specific fields
  @Column({ type: 'boolean', default: false })
  psychologist: boolean;

  @Column({ type: 'boolean', nullable: true })
  public: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  crp: string;

  @Column({ type: 'boolean', nullable: true })
  validCRP: boolean;

  @Column({ type: 'simple-array', nullable: true })
  specializations: Specialization[];

  @Column({ type: 'varchar', length: 20, nullable: true })
  whatsapp: string;

  @Column({ type: 'decimal', precision: 7, scale: 2, default: null, nullable: true, transformer: new ColumnDecimalTransformer() })
  sessionCost: number;

  @Column({ type: 'text', nullable: true })
  bio: string;

}
