import { Controller } from '@nestjs/common';
import { ChatService } from '@modules/chat/chat.service';

@Controller('v1/chat')
export class ChatController {

  constructor(private readonly chatService: ChatService) {}

}