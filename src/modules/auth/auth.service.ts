import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../../core/entities/user.entity';
import {
  SigninDTO,
  RefreshTokensResponseDTO,
  SignupDTO,
  RefreshTokenDTO,
  SigninResponseDTO,
  MeResponseDTO,
  UpdateMeDTO
} from '../auth/auth.dto';
import { BcryptService } from '../../core/services/bcrypt.service';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { RefreshToken } from '../../core/entities/refresh-token.entity';
import { AccessToken } from '../../core/entities/access-token.entity';
import { BaseMessageDTO } from '../../core/dtos/generic.dto';

@Injectable()
export class AuthService {

  constructor(
    private readonly dataSource: DataSource,
    private readonly bcryptService: BcryptService,
    private readonly jwtService: JwtService,
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
      data.modality = user.modality;
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

    if ('photo' in body) {
      user.photo = body.photo;
    }

    // TODO: update email and password

    if (user.psychologist) {
      if (typeof body.public === 'boolean') {
        user.public = body.public;
      }

      if (body.modality) {
        user.modality = body.modality;
      }

      if ('crp' in body) {
        user.crp = body.crp;
      }

      if ('sessionCost' in body) {
        user.sessionCost = body.sessionCost;
      }

      if ('bio' in body) {
        user.bio = body.bio;
      }
    }

    await this.dataSource.getRepository(User).save(user);

    return { message: 'Profile updated successfully' };
  }

  public async signup(body: SignupDTO): Promise<BaseMessageDTO> {
    await this.validateSignupData(body);

    const data = new User();

    data.photo = body.photo;
    data.name = body.name;
    data.email = body.email;
    data.psychologist = body.psychologist;
    data.password = await this.bcryptService.hash(body.password);

    if (body.psychologist && body.public) {
      data.public = body.public;
      data.crp = body.crp;
      data.modality = body.modality;
      data.specializations = body.specializations;
      data.whatsapp = body.whatsapp;
      data.sessionCost = body.sessionCost;
      data.bio = body.bio;
    }

    await this.dataSource.getRepository(User).save(data);

    return { message: 'Account created successfully' };
  }

  public async signin(body: SigninDTO): Promise<SigninResponseDTO> {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { email: body.email },
      select: { id: true, password: true },
    });

    await this.validateSigninData(body, user);

    const tokens = await this.generateUserTokens(user!.id);

    return {
      ...tokens,
      userId: user!.id,
    };
  }

  public async refresh(body: RefreshTokenDTO, userId: string): Promise<RefreshTokensResponseDTO> {
    const token = await this.dataSource.getRepository(RefreshToken)
      .createQueryBuilder('token')
      .where('token.token = :token', { token: body.refreshToken })
      .andWhere('token.userId = :userId', { userId })
      .andWhere('token.expiresAt > :now', { now: new Date() })
      .getOne();

    if (!token) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.generateUserTokens(token.userId);
  }

  public async logout(userId: string): Promise<BaseMessageDTO> {
    await this.dataSource.getRepository(RefreshToken).delete({ user: { id: userId } });
    await this.dataSource.getRepository(AccessToken).delete({ user: { id: userId } });

    return {
      message: 'Logout successful',
    };
  }

  public async cancelAccount(userId: string): Promise<BaseMessageDTO> {
    // TODO: criar job para deletar o usuário após 30 dias
    await this.dataSource.getRepository(User).delete({ id: userId });

    return {
      message: 'Account cancelled successfully',
    };
  }

  private async validateSignupData(body: SignupDTO): Promise<void> {
    const userAlreadyExists = await this.dataSource.getRepository(User).exists({ where: { email: body.email } });

    if (userAlreadyExists) {
      throw new BadRequestException('User already exists');
    }

    if (body.password !== body.passwordConfirmation) {
      throw new BadRequestException('Password and password confirmation do not match');
    }

    if (body.psychologist && body.public) {
      if (!body.crp) {
        throw new BadRequestException('CRP is required');
      }

      if (!body.modality) {
        throw new BadRequestException('Modality is required');
      }

      if (body.sessionCost == null) {
        throw new BadRequestException('Session cost is required');
      }
    }
  }

  private async validateSigninData(body: SigninDTO, user: User | null): Promise<void> {
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.bcryptService.compare(body.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  private validateUpdateMeData(body: UpdateMeDTO, user: User): void {
    const willBePublic = body.public && !user.public;

    if (user.psychologist && willBePublic) {
      if (!user.crp && (!body.crp || body.crp === '')) {
        throw new BadRequestException('CRP is required');
      }

      if (!user.modality && !body.modality) {
        throw new BadRequestException('Modality is required');
      }

      if (!body.sessionCost && body.sessionCost !== 0 && !user.sessionCost) {
        throw new BadRequestException('Session cost is required');
      }
    }
  }

  private async generateUserTokens(userId: string): Promise<RefreshTokensResponseDTO> {
    const accessToken = this.jwtService.sign({ userId }, { expiresIn: '2d' });
    const refreshToken = uuidv4();

    await this.saveRefreshToken(refreshToken, userId);
    await this.saveAccessToken(accessToken, userId);

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  }

  private async saveRefreshToken(token: string, userId: string): Promise<RefreshToken> {
    const refreshTokenData = new RefreshToken();
    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + 3); // 3 days

    refreshTokenData.token = token;
    refreshTokenData.user = new User();
    refreshTokenData.user.id = userId;
    refreshTokenData.expiresAt = expiresAt;

    await this.dataSource.getRepository(RefreshToken).delete({ user: { id: userId } });

    return this.dataSource.getRepository(RefreshToken).save(refreshTokenData);
  }

  private async saveAccessToken(token: string, userId: string): Promise<AccessToken> {
    const accessTokenData = new AccessToken();

    accessTokenData.token = token;
    accessTokenData.user = new User();
    accessTokenData.user.id = userId;

    await this.dataSource.getRepository(AccessToken).delete({ user: { id: userId } });

    return this.dataSource.getRepository(AccessToken).save(accessTokenData);
  }

}
