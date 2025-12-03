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
import { CookieService } from '../../core/services/cookie.service';
import { Response } from 'express';

@Injectable()
export class AuthService {

  constructor(
    private readonly dataSource: DataSource,
    private readonly bcryptService: BcryptService,
    private readonly cookieService: CookieService,
  ) {}

  public async getMe(userId: string): Promise<MeResponseDTO> {
    const user = await this.dataSource.getRepository(User).findOneOrFail({ where: { id: userId } });
    const data: MeResponseDTO = {
      id: user.id,
      name: user.name,
      email: user.email,
      photo: user.photo,
    };

    if (user.psychologist && user.public) {
      data.crp = user.crp;
      data.sessionCost = user.sessionCost;
      data.bio = user.bio;
    }

    return data;
  }

  public async updateMe(userId: string, body: UpdateMeDTO): Promise<BaseMessageDTO> {
    const user = await this.dataSource.getRepository(User).findOneOrFail({ where: { id: userId } });

    this.validateUpdateMeData(body, user);

    if (body.name) {
      user.name = body.name;
    }

    if (body.photo !== undefined) {
      user.photo = body.photo;
    }

    if (user.psychologist) {
      if (typeof body.public === 'boolean') {
        user.public = body.public;
      }

      if (body.crp !== undefined) {
        user.crp = body.crp;
      }

      if (body.sessionCost !== undefined) {
        user.sessionCost = body.sessionCost;
      }

      if (body.bio !== undefined) {
        user.bio = body.bio;
      }
    }

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
    const cookie = this.cookieService.serialize({
      name: 'sid',
      value: session.token,
      maxAge: session.maxAge,
      path: '/',
      httpOnly: true,
      secure: true,
    });

    response.setHeader('Set-Cookie', cookie);

    return session;
  }

  public async logout(userId: string): Promise<BaseMessageDTO> {
    await this.dataSource.getRepository(Session).delete({ user: { id: userId } });

    return {
      message: { key: 'auth.logout_successful' },
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

    if (body.psychologist && body.public) {
      if (!body.crp) {
        throw new BadRequestException({ key: 'auth.crp_is_required' });
      }

      if (body.sessionCost == null) {
        throw new BadRequestException({ key: 'auth.session_cost_is_required' });
      }
    }
  }

  private async createUser(body: SignupDTO): Promise<User> {
    const data = new User();

    data.photo = body.photo;
    data.name = body.name;
    data.email = body.email;
    data.psychologist = body.psychologist;
    data.password = await this.bcryptService.hash(body.password);

    if (body.psychologist && body.public) {
      data.public = body.public;
      data.crp = body.crp;
      data.specializations = body.specializations;
      data.whatsapp = body.whatsapp;
      data.sessionCost = body.sessionCost;
      data.bio = body.bio;
    }

    return this.dataSource.getRepository(User).save(data);
  }

  private async getAuthenticatedUser(body: SigninDTO): Promise<User> {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { email: body.email },
      select: { id: true, password: true },
    });

    if (!user) {
      throw new UnauthorizedException({ key: 'auth.invalid_credentials' });
    }

    const isPasswordValid = await this.bcryptService.compare(body.password, user.password);

    if (!isPasswordValid) {
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

  private validateUpdateMeData(body: UpdateMeDTO, user: User): void {
    const willBePublic = body.public && !user.public;

    if (user.psychologist && willBePublic) {
      if (!user.crp && (!body.crp || body.crp === '')) {
        throw new BadRequestException({ key: 'auth.crp_is_required' });
      }

      if (body.sessionCost == null) {
        throw new BadRequestException({ key: 'auth.session_cost_is_required' });
      }
    }
  }

}
