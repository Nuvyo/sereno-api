import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../entities/user.entity';
import { Session } from '../entities/session.entity';
import { AuditLog } from '../entities/audit-log.entity';

dotenv.config();

export const entities = [User, Session, AuditLog];

export const PostgresConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  ssl: process.env.POSTGRES_SSLMODE === 'require' ? { rejectUnauthorized: true } : false,
  synchronize: process.env.NODE_ENV !== 'production' && process.env.TYPEORM_SYNCHRONIZE === 'true',
  logging: process.env.NODE_ENV === 'production' ? ['error'] : false,
  migrations: [__dirname + '/../migration/*.{ts,js}'],
  entities,
  extra: {
    max: Number(process.env.POSTGRES_POOLSIZE) || 10,
    idleTimeoutMillis: Number(process.env.POSTGRES_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: Number(process.env.POSTGRES_CONN_TIMEOUT) || 5000
  },
};

const PostgresMigrationDatasourceConfig = {
  ...PostgresConfig,
};

export const PostgresMigrationDatasource = new DataSource(PostgresMigrationDatasourceConfig);
