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

    try {
      const session = await this.getUserSession(request);

      request.userId = session.userId;
    } catch {
      throw new UnauthorizedException({ key: 'auth.invalid_session' });
    }

    return true;
  }

  private async getUserSession(request: Request): Promise<Session> {
    const token = this.extractTokenFromHeader(request);

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

  private extractTokenFromHeader(request: Request): string | null {
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      return null;
    }

    const token = authHeader.split(' ')[1];

    return token || null;
  }

}
