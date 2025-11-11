import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresDataSource } from '../core/datasources/postgres.datasource';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { I18nModule, HeaderResolver } from 'nestjs-i18n';
import path from 'node:path';
import * as dotenv from 'dotenv';
import { AppController } from './app.controller';
import { AppService } from './app.service';

dotenv.config();

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'pt-br',
      loaderOptions: {
        path: path.join(__dirname, '../i18n/'),
        watch: true,
      },
      resolvers: [{ use: HeaderResolver, options: ['language'] }],
    }),
    JwtModule.register({ global: true, secret: process.env.JWT_SECRET }),
    TypeOrmModule.forRoot(PostgresDataSource),
    UserModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
