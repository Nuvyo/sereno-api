import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuditLog, AuditAction } from '../entities/audit-log.entity';

export interface IAuditContext {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogService {

  constructor(private readonly dataSource: DataSource) {}

  public async log(data: { userId?: string; action: AuditAction } & IAuditContext): Promise<void> {
    const entry = new AuditLog();

    entry.userId = data.userId ?? null;
    entry.action = data.action;
    entry.ip = data.ip ?? null;
    entry.userAgent = data.userAgent ?? null;

    await this.dataSource.getRepository(AuditLog).save(entry).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Failed to write audit log:', err);
    });
  }

}
