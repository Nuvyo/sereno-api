import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { CustomBaseEntity } from '@core/entities/utils/base.entity';
import { User } from '@core/entities/user.entity';
import { Chat } from '@core/entities/chat.entity';

@Entity({ name: 'chat_messages' })
export class ChatMessage extends CustomBaseEntity {

  @RelationId((chatMessage: ChatMessage) => chatMessage.user)
  user_id: string;

  @RelationId((chatMessage: ChatMessage) => chatMessage.chat)
  chat_id: string;

  @Column({ type: 'text', nullable: false })
  message: string;

  @ManyToOne(() => User, (user) => user.chat_messages, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Chat, (chat) => chat.messages)
  chat: Chat;

}