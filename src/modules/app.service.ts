import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ServerStatusDTO } from '@modules/app.dto';

@Injectable()
export class AppService {

  constructor(
    private readonly dataSource: DataSource,
  ) {}

  public async getStatus(): Promise<ServerStatusDTO> {
    const dbVersion = await this.dataSource.query('SELECT version()');
    const dbMaxConnections = await this.dataSource.query('SHOW max_connections');
    const dbOpenedConnections = await this.dataSource.query('SELECT count(*) FROM pg_stat_activity');
    const data: ServerStatusDTO = {
      updated_at: new Date().toISOString(),
      dependencies: {
        database: {
          version: dbVersion[0].version,
          max_connections: parseInt(dbMaxConnections[0].max_connections, 10),
          opened_connections: parseInt(dbOpenedConnections[0].count, 10),
        },
      },
    };

    return data;
  }

}
