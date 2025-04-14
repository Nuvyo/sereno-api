import { Column, Entity, ManyToMany, OneToMany, OneToOne, RelationId } from 'typeorm';
import { CustomBaseEntity } from '@core/entities/utils/base.entity';
import { SessionNote } from '@core/entities/session-note.entity';
import { SessionPresence } from '@core/entities/session-presence.entity';
import { Session } from '@core/entities/session.entity';
import { ChatMessage } from '@core/entities/chat-message.entity';
import { Chat } from '@core/entities/chat.entity';
import { ChatConfig } from '@core/entities/chat-config.entity';
import { PsychologistDetail } from '@core/entities/psychologist-detail.entity';
import { RefreshToken } from '@core/entities/refresh-token.entity';
import { AccessToken } from '@core/entities/access-token.entity';
import { Like } from '@core/entities/like.entity';

@Entity({ name: 'users' })
export class User extends CustomBaseEntity {

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 60, nullable: false, select: false })
  password: string;

  @Column({ type: 'boolean', default: false })
  isPsychologist: boolean;

  @RelationId((user: User) => user.psychologistDetail)
  psychologistDetailId: string;

  @OneToOne(() => PsychologistDetail, (psychologistConfig) => psychologistConfig.user, { cascade: true })
  psychologistDetail: PsychologistDetail;

  @ManyToMany(() => Session, (session) => session.users)
  sessions: Session[];

  @ManyToMany(() => SessionPresence, (presence) => presence.user)
  sessionPresences: SessionPresence[];

  @OneToMany(() => SessionNote, (sessionNotes) => sessionNotes.user)
  sessionNotes: SessionNote[];

  @OneToMany(() => ChatMessage, (chatMessage) => chatMessage.user)
  chatMessages: ChatMessage[];

  @OneToMany(() => Chat, (chat) => chat.users)
  chats: Chat[];

  @OneToMany(() => ChatConfig, (chatConfig) => chatConfig.user)
  chatConfigs: ChatConfig[];

  @OneToMany(() => Like, (like) => like.user)
  likesGiven: Like[];

  @OneToOne(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshToken: RefreshToken;

  @OneToOne(() => AccessToken, (blockedToken) => blockedToken.user)
  accessToken: AccessToken;

}