import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { ChatMessage } from '../entities/chat-message.entity';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { AccessToken } from '../entities/access-token.entity';

dotenv.config();

export const PostgresConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  username: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.NODE_ENV === 'test' ? process.env.PGDATABASE_TEST : process.env.PGDATABASE,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
  synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
  logging: false,
  migrations: [__dirname + '/../migration/*.{ts,js}'],
  entities: [
    AccessToken,
    ChatMessage,
    RefreshToken,
    User,
  ],
  extra: {
    max: Number(process.env.PGPOOLSIZE) || 10,
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT) || 5000,
    application_name: process.env.PGAPPNAME,
  },
};

const PostgresMigrationDatasourceConfig = {
  ...PostgresConfig,
};

export const PostgresMigrationDatasource = new DataSource(PostgresMigrationDatasourceConfig);
