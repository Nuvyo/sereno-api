import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ServerStatusDTO } from './app.dto';

@Injectable()
export class AppService {

  constructor(private readonly dataSource: DataSource) {}

  public async getStatus(): Promise<ServerStatusDTO> {
    const dbVersion = await this.dataSource.query('SELECT version()');
    const dbMaxConnections = await this.dataSource.query('SHOW max_connections');
    // Conta somente conexões desta aplicação (filtra por application_name configurado em extra.application_name)
    const applicationName = process.env.PGAPPNAME || 'sereno-api';
    const dbOpenedConnections = await this.dataSource.query(
      'SELECT count(*) FROM pg_stat_activity WHERE application_name = $1',
      [applicationName],
    );
    const fullVersion: string = dbVersion[0].version;
    const shortVersionMatch = /PostgreSQL\s+(\d+(?:\.\d+)?)/i.exec(fullVersion);
    const shortVersion = shortVersionMatch ? shortVersionMatch[0] : fullVersion;
    const data: ServerStatusDTO = {
      updated_at: new Date().toISOString(),
      dependencies: {
        database: {
          version: shortVersion,
          max_connections: parseInt(dbMaxConnections[0].max_connections, 10),
          opened_connections: parseInt(dbOpenedConnections[0].count, 10),
        },
      },
    };

    return data;
  }

}
