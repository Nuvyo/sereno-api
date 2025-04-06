import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { Chat } from '@entities/chat.entity';
import { User } from '@entities/user.entity';
import { CustomBaseEntity } from '@entities/utils/base.entity';

@Entity({ name: 'chat_configs' })
export class ChatConfig extends CustomBaseEntity {

  @Column({ type: 'varchar', length: 6, nullable: true })
  color: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  icon: string;

  @RelationId((chatConfig: ChatConfig) => chatConfig.chat)
  chat_id: string;

  @RelationId((chatConfig: ChatConfig) => chatConfig.user)
  user_id: string;

  @ManyToOne(() => User, (user) => user.chat_configs)
  user: User;

  @ManyToOne(() => Chat, (chat) => chat.configs)
  chat: Chat;

}