import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../../core/entities/user.entity';
import {
  SigninDTO,
  SignupDTO,
  MeResponseDTO,
  UpdateMeDTO,
} from '../auth/auth.dto';
import { BcryptService } from '../../core/services/bcrypt.service';
import crypto from 'node:crypto';
import { BaseMessageDTO } from '../../core/dtos/generic.dto';
import { Session } from '../../core/entities/session.entity';
import { daysInMilliseconds } from '../../core/utils/utils';
import { Response } from 'express';

@Injectable()
export class AuthService {

  constructor(
    private readonly dataSource: DataSource,
    private readonly bcryptService: BcryptService,
  ) {}

  public async getMe(userId: string): Promise<MeResponseDTO> {
    const user = await this.dataSource.getRepository(User).findOneOrFail({
      where: { id: userId },
    });
    const data: MeResponseDTO = {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  
    return data;
  }

  public async updateMe(userId: string, body: UpdateMeDTO): Promise<BaseMessageDTO> {
    const user = await this.dataSource.getRepository(User).findOneOrFail({ where: { id: userId } });

    if (body.name !== undefined) user.name = body.name;

    await this.dataSource.getRepository(User).save(user);

    return { message: { key: 'auth.profile_updated' } };
  }

  public async signup(body: SignupDTO): Promise<BaseMessageDTO> {
    await this.validateSignupData(body);
    await this.createUser(body);

    return { message: { key: 'auth.signup_successful' } };
  }

  public async signin(body: SigninDTO, response: Response): Promise<Session> {
    const user = await this.getAuthenticatedUser(body);
    const session = await this.createUserSession(user.id);

    response.cookie('sid', session.token, {
      maxAge: session.maxAge * 1000,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return session;
  }

  public async signout(userId: string, sessionId: string): Promise<BaseMessageDTO> {
    await this.dataSource.getRepository(Session).delete({ id: sessionId, user: { id: userId } });

    return {
      message: { key: 'auth.signout_successful' },
    };
  }

  public async signoutAll(userId: string): Promise<BaseMessageDTO> {
    await this.dataSource.getRepository(Session).delete({ user: { id: userId } });

    return {
      message: { key: 'auth.signout_successful' },
    };
  }

  public async cancelAccount(userId: string): Promise<BaseMessageDTO> {
    await this.dataSource.getRepository(User).delete({ id: userId });

    return {
      message: { key: 'auth.account_cancellation_successful' },
    };
  }

  private async validateSignupData(body: SignupDTO): Promise<void> {
    const userAlreadyExists = await this.dataSource.getRepository(User).exists({ where: { email: body.email } });

    if (userAlreadyExists) {
      throw new BadRequestException({ key: 'auth.email_already_in_use' });
    }

    if (body.password !== body.passwordConfirmation) {
      throw new BadRequestException({ key: 'auth.passwords_do_not_match' });
    }
  }

  private async createUser(body: SignupDTO): Promise<User> {
    const data = new User();

    data.name = body.name;
    data.email = body.email;
    data.password = await this.bcryptService.hash(body.password);

    return this.dataSource.getRepository(User).save(data);
  }

  private async getAuthenticatedUser(body: SigninDTO): Promise<User> {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { email: body.email },
      select: { id: true, password: true },
    });
    const passwordHash = user?.password || '';
    const isPasswordValid = await this.bcryptService.compare(body.password, passwordHash);

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException({ key: 'auth.invalid_credentials' });
    }

    return user;
  }

  private async createUserSession(userId: string): Promise<Session> {
    const newSession = new Session();
    const expirationInMilliseconds = daysInMilliseconds(30);

    newSession.token = crypto.randomBytes(48).toString('hex');
    newSession.expiresAt = new Date(Date.now() + expirationInMilliseconds);
    newSession.maxAge = expirationInMilliseconds / 1000;
    newSession.user = new User();
    newSession.user.id = userId;

    const savedSession = await this.dataSource.getRepository(Session).save(newSession);

    delete (savedSession as any).user;

    return savedSession;
  }

}
