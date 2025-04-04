import { Column, Entity, ManyToMany, OneToMany, OneToOne, RelationId } from 'typeorm';
import { CustomBaseEntity } from '@entities/base.entity';
import { SessionNote } from '@entities/session-note.entity';
import { SessionPresence } from '@entities/session-presence.entity';
import { Session } from '@entities/session.entity';
import { ChatMessage } from '@entities/chat-message.entity';
import { Chat } from '@entities/chat.entity';
import { ChatConfig } from '@entities/chat-config.entity';
import { PsychologistConfig } from '@entities/psychologist-config.entity';
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

  @RelationId((user: User) => user.psychologist_config)
  psychologist_config_id: string;

  @OneToOne(() => PsychologistConfig, (psychologistConfig) => psychologistConfig.user)
  psychologist_config: PsychologistConfig;

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