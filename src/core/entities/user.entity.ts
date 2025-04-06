import { Column, Entity, ManyToMany, OneToMany, OneToOne, RelationId } from 'typeorm';
import { CustomBaseEntity } from '@core/entities/utils/base.entity';
import { SessionNote } from '@core/entities/session-note.entity';
import { SessionPresence } from '@core/entities/session-presence.entity';
import { Session } from '@core/entities/session.entity';
import { ChatMessage } from '@core/entities/chat-message.entity';
import { Chat } from '@core/entities/chat.entity';
import { ChatConfig } from '@core/entities/chat-config.entity';
import { PsychologistDetail } from '@core/entities/psychologist-detail.entity';
import { RefreshToken } from './refresh-token.entity';
import { AccessToken } from './access-token.entity';

@Entity({ name: 'users' })
export class User extends CustomBaseEntity {

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 60, nullable: false, select: false })
  password: string;

  @Column({ type: 'boolean', default: false })
  is_psychologist: boolean;

  @RelationId((user: User) => user.psychologist_detail)
  psychologist_detail_id: string;

  @OneToOne(() => PsychologistDetail, (psychologistConfig) => psychologistConfig.user)
  psychologist_detail: PsychologistDetail;

  @ManyToMany(() => Session, (session) => session.users)
  sessions: Session[];

  @ManyToMany(() => SessionPresence, (presence) => presence.user)
  session_presences: SessionPresence[];

  @OneToMany(() => SessionNote, (sessionNotes) => sessionNotes.user)
  session_notes: SessionNote[];

  @OneToMany(() => ChatMessage, (chatMessage) => chatMessage.user)
  chat_messages: ChatMessage[];

  @OneToMany(() => Chat, (chat) => chat.users)
  chats: Chat[];

  @OneToMany(() => ChatConfig, (chatConfig) => chatConfig.user)
  chat_configs: ChatConfig[];

  @OneToOne(() => RefreshToken, (refreshToken) => refreshToken.user)
  refresh_token: RefreshToken;

  @OneToOne(() => AccessToken, (blockedToken) => blockedToken.user)
  access_token: AccessToken;

}