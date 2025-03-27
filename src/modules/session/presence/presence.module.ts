import { Module } from '@nestjs/common';
import { SessionPresenceService } from '@modules/session/presence/presence.service';

@Module({
  imports: [],
  providers: [SessionPresenceService],
  exports: [SessionPresenceService],
})
export class SessionPresenceModule {}