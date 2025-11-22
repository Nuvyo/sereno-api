import { Module } from '@nestjs/common';
import { PsychologistModule } from './psychologist/psychologist.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresConfig } from '../core/datasources/postgres.datasource';
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
    TypeOrmModule.forRoot(PostgresConfig),
    PsychologistModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
