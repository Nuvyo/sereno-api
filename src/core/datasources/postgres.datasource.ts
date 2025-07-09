import { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { ChatMessage } from '@core/entities/chat-message.entity';
import { User } from '@core/entities/user.entity';
import { Address } from '@core/entities/address.entity';
import { RefreshToken } from '@core/entities/refresh-token.entity';
import { AccessToken } from '@core/entities/access-token.entity';
import { Like } from '@core/entities/like.entity';

dotenv.config();

export const PostgresDataSource: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.NODE_ENV === 'test' ? process.env.POSTGRES_DB_TEST : process.env.POSTGRES_DB,
  synchronize: true,
  logging: false,
  entities: [
    AccessToken,
    Address,
    ChatMessage,
    Like,
    RefreshToken,
    User,
  ]
};
