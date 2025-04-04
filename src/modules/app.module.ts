import { Module } from '@nestjs/common';
import { ChatModule } from '@modules/chat/chat.module';
import { SessionModule } from '@modules/session/session.module';
import { UserModule } from '@modules/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresDataSource } from '@core/datasources/postgres.datasource';
import { AuthModule } from '@modules/auth/auth.module';
import * as dotenv from 'dotenv';
import { JwtModule } from '@nestjs/jwt';

dotenv.config();

@Module({
  imports: [
    JwtModule.register({ global: true, secret: process.env.JWT_SECRET }),
    TypeOrmModule.forRoot(PostgresDataSource),
    ChatModule,
    SessionModule,
    UserModule,
    AuthModule
  ]
})
export class AppModule {}
