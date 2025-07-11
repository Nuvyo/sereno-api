import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { ChatMessage } from '@core/entities/chat-message.entity';
import { Address } from '@core/entities/address.entity';
import { RefreshToken } from '@core/entities/refresh-token.entity';
import { AccessToken } from '@core/entities/access-token.entity';
import { Like } from '@core/entities/like.entity';
import { CustomBaseEntity } from '@core/entities/utils/base.entity';
import { ColumnDecimalTransformer } from '@core/entities/utils/transformers';

export enum Modality {
  Online = 'online',
  InPerson = 'in_person',
  Both = 'both',
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

  @OneToMany(() => Like, (like) => like.fromUser)
  likesGiven: Like[];

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

  @Column({ type: 'enum', enum: Modality, nullable: true })
  modality: Modality;

  @Column({ type: 'decimal', precision: 7, scale: 2, default: null, nullable: true, transformer: new ColumnDecimalTransformer() })
  sessionCost: number;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @OneToMany(() => Like, (like) => like.toUser)
  likesReceived: Like[];

  @OneToOne(() => Address, (address) => address.user, { cascade: true, eager: true })
  address: Address;

}
