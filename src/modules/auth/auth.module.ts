import { Module } from '@nestjs/common';
import { AuthController } from '@modules/auth/auth.controller';
import { AuthService } from '@modules/auth/auth.service';
import { BcryptService } from '@core/services/bcrypt.service';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService, BcryptService],
  exports: [AuthService],
})
export class AuthModule {}