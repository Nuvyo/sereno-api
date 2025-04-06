import { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { ChatConfig } from '@entities/chat-config.entity';
import { ChatMessage } from '@entities/chat-message.entity';
import { Chat } from '@entities/chat.entity';
import { PsychologistDetail } from '@entities/psychologist-detail.entity';
import { SessionNote } from '@entities/session-note.entity';
import { SessionPresence } from '@entities/session-presence.entity';
import { Session } from '@entities/session.entity';
import { User } from '@entities/user.entity';
import { Address } from '@entities/address.entity';
import { RefreshToken } from '@entities/refresh-token.entity';
import { AccessToken } from '@entities/access-token.entity';

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
    ChatConfig,
    ChatMessage,
    Chat,
    PsychologistDetail,
    RefreshToken,
    SessionNote,
    SessionPresence,
    Session,
    User,
  ]
};