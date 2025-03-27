import { Module } from '@nestjs/common';
import { SessionNoteService } from '@modules/session/note/note.service';

@Module({
  imports: [],
  providers: [SessionNoteService],
  exports: [SessionNoteService],
})
export class SessionNoteModule {}