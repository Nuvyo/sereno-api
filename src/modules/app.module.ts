import { Module } from '@nestjs/common';
import { UserModule } from '@modules/user/user.module';
import { StatusModule } from '@modules/status/status.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresDataSource } from '@core/datasources/postgres.datasource';
import { AuthModule } from '@modules/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { I18nModule, HeaderResolver } from 'nestjs-i18n';
import path from 'node:path';
import * as dotenv from 'dotenv';

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
    StatusModule,
    AuthModule
  ]
})
export class AppModule {}
