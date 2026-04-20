import { Module } from '@nestjs/common';
import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { BcryptService } from '../../core/services/bcrypt.service';
import { DictionaryService } from '../../core/services/dictionary.service';
import { AuditLogService } from '../../core/services/audit-log.service';
import { QueueModule } from '../../core/queue/queue.module';

@Module({
  imports: [QueueModule],
  controllers: [AuthController],
  providers: [AuthService, BcryptService, DictionaryService, AuditLogService],
  exports: [AuthService],
})
export class AuthModule {}
