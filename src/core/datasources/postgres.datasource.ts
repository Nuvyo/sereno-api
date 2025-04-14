import { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { ChatConfig } from '@core/entities/chat-config.entity';
import { ChatMessage } from '@core/entities/chat-message.entity';
import { Chat } from '@core/entities/chat.entity';
import { PsychologistDetail } from '@core/entities/psychologist-detail.entity';
import { SessionNote } from '@core/entities/session-note.entity';
import { SessionPresence } from '@core/entities/session-presence.entity';
import { Session } from '@core/entities/session.entity';
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
    ChatConfig,
    ChatMessage,
    Chat,
    Like,
    PsychologistDetail,
    RefreshToken,
    SessionNote,
    SessionPresence,
    Session,
    User,
  ]
};