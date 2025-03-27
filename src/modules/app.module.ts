import { Module } from '@nestjs/common';
import { ChatModule } from '@modules/chat/chat.module';
import { SessionModule } from '@modules/session/session.module';
import { UserModule } from '@modules/user/user.module';

@Module({
  imports: [
    ChatModule,
    SessionModule,
    UserModule
  ]
})
export class AppModule {}
