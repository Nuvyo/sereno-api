import { Entity, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { CustomBaseEntity } from '@entities/utils/base.entity';
import { User } from '@entities/user.entity';
import { ChatMessage } from '@entities/chat-message.entity';
import { ChatConfig } from './chat-config.entity';

@Entity({ name: 'chats' })
export class Chat extends CustomBaseEntity {

  @ManyToMany(() => User, (user) => user.chats, { onDelete: 'CASCADE' })
  users: User[];

  @ManyToOne(() => ChatMessage, (message) => message.chat)
  messages: ChatMessage[];

  @OneToMany(() => ChatConfig, (chatConfig) => chatConfig.chat)
  configs: ChatConfig[];

}