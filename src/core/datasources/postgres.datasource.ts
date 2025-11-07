import { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { ChatMessage } from '../entities/chat-message.entity';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { AccessToken } from '../entities/access-token.entity';

dotenv.config();

export const PostgresDataSource: DataSourceOptions = {
  type: 'postgres',
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  username: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.NODE_ENV === 'test' ? process.env.PGDATABASE_TEST : process.env.PGDATABASE,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
  synchronize: true,
  logging: false,
  entities: [
    AccessToken,
    ChatMessage,
    RefreshToken,
    User,
  ]
};
