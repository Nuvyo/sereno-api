import { Module } from '@nestjs/common';
import { ChatController } from '@modules/chat/chat.controller';
import { ChatService } from '@modules/chat/chat.service';

@Module({
  imports: [],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}