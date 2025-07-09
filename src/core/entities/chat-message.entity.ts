import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { CustomBaseEntity } from '@core/entities/utils/base.entity';
import { User } from '@core/entities/user.entity';

@Entity({ name: 'chat_messages' })
export class ChatMessage extends CustomBaseEntity {

  @Column({ type: 'text', nullable: false })
  message: string;

  @RelationId((chatMessage: ChatMessage) => chatMessage.fromUser)
  fromUserId: string;

  @RelationId((chatMessage: ChatMessage) => chatMessage.toUser)
  toUserId: string;

  @ManyToOne(() => User, (user) => user.messagesSent, { onDelete: 'CASCADE' })
  fromUser: User;

  @ManyToOne(() => User, (user) => user.messagesReceived, { onDelete: 'CASCADE' })
  toUser: User;

}
