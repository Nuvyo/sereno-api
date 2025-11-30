import { Module } from '@nestjs/common';
import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { BcryptService } from '../../core/services/bcrypt.service';
import { DictionaryService } from '../../core/services/dictionary.service';
import { CookieService } from '../../core/services/cookie.service';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService, BcryptService, DictionaryService, CookieService],
  exports: [AuthService],
})
export class AuthModule {}
