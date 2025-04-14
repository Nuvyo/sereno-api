import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { Chat } from '@core/entities/chat.entity';
import { User } from '@core/entities/user.entity';
import { CustomBaseEntity } from '@core/entities/utils/base.entity';

@Entity({ name: 'chat_configs' })
export class ChatConfig extends CustomBaseEntity {

  @Column({ type: 'varchar', length: 6, nullable: true })
  color: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  icon: string;

  @RelationId((chatConfig: ChatConfig) => chatConfig.chat)
  chatId: string;

  @RelationId((chatConfig: ChatConfig) => chatConfig.user)
  userId: string;

  @ManyToOne(() => User, (user) => user.chatConfigs)
  user: User;

  @ManyToOne(() => Chat, (chat) => chat.configs)
  chat: Chat;

}