import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export interface ISystemStatus {
  updatedAt: Date;
  dependencies: {
    database: ISystemDatabaseStatus;
  }
}

export interface ISystemDatabaseStatus {
  version: string;
  maxConnections: number;
  openedConnections: number;
}

@Injectable()
export class StatusService {

  constructor(private readonly dataSource: DataSource) {}

  public async getStatus() {
    const version = await this.dataSource.query('SHOW server_version');
    const maxConnections = await this.dataSource.query('SHOW max_connections');
    const openedConnections = await this.dataSource.query('SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1', [process.env.POSTGRES_DB]);
    const databaseStatus: ISystemDatabaseStatus = {
      version: version[0].server_version,
      maxConnections: Number(maxConnections[0].max_connections),
      openedConnections: openedConnections[0].count,
    };

    return {
      updatedAt: new Date(),
      dependencies: {
        database: databaseStatus,
      },
    } as ISystemStatus;
  }

}
