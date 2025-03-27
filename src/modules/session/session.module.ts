import { Module } from '@nestjs/common';
import { SessionController } from '@modules/session/session.controller';
import { SessionService } from '@modules/session/session.service';
import { SessionNoteModule } from './note/note.module';
import { SessionPresenceModule } from './presence/presence.module';

@Module({
  imports: [SessionNoteModule, SessionPresenceModule],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}