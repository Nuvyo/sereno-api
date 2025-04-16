import { Module } from '@nestjs/common';
import { UserModule } from '@modules/user/user.module';
import { StatusModule } from '@modules/status/status.module';
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
    UserModule,
    StatusModule,
    AuthModule
  ]
})
export class AppModule {}
