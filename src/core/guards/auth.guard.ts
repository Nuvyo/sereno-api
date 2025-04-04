import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { AccessToken } from '@entities/access-token.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  
  constructor(
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    try {
      const token = this.extractTokenFromHeader(request);

      if (!token) {
        throw new UnauthorizedException('Invalid token');
      }

      const decoded = this.jwtService.verify<{ [key: string]: string }>(token);
      const currentAccessToken = await this.dataSource.getRepository(AccessToken).findOneBy({ user: { id: decoded.userId } });

      if (!currentAccessToken || token !== currentAccessToken.token) {
        throw new UnauthorizedException('Invalid token');
      }

      request.userId = decoded.userId;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    return true;
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