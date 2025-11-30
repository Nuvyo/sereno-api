import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { Session } from '../entities/session.entity';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    private readonly dataSource: DataSource,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const session = await this.getUserSession(request);

    request.userId = session.userId;

    return true;
  }

  private async getUserSession(request: Request): Promise<Session> {
    const token = request.headers.cookie?.split('sid=')[1]?.split(';')[0];

    if (!token) {
      throw new UnauthorizedException({ key: 'auth.invalid_session' });
    }

    const session = await this.dataSource.getRepository(Session).findOneBy({ token });

    if (!session) {
      throw new UnauthorizedException({ key: 'auth.invalid_session' });
    }

    if (new Date(session.expiresAt) < new Date()) {
      throw new UnauthorizedException({ key: 'auth.invalid_session' });
    }

    return session;
  }

}
