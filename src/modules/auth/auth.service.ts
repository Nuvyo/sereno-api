import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '@entities/user.entity';
import { SigninDTO, SessionTokensDTO, SignupDTO, RefreshTokenDTO, SigninResponseDTO, MeDTO, PsychologistDetailDTO } from '@dtos/auth.dto';
import { BcryptService } from '@core/services/bcrypt.service';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { RefreshToken } from '@entities/refresh-token.entity';
import { AccessToken } from '@entities/access-token.entity';
import { BaseMessageDTO } from '@dtos/generic.dto';
import { PsychologistDetail } from '@entities/psychologist-detail.entity';

@Injectable()
export class AuthService {

  constructor(
    private readonly dataSource: DataSource,
    private readonly bcryptService: BcryptService,
    private readonly jwtService: JwtService,
  ) {}

  public async me(userId: string): Promise<MeDTO> {
    const user = await this.dataSource.getRepository(User).findOneOrFail({ where: { id: userId } });
    const data: MeDTO = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    if (user.is_psychologist) {
      const psychologistDetail = await this.dataSource.getRepository(PsychologistDetail).findOne({
        where: { user: { id: userId } },
        select: {}
      });

      if (psychologistDetail) {
        data['psychologist_detail'] = psychologistDetail;
      }
    }

    return data;
  }

  public async signup(body: SignupDTO): Promise<User> {
    await this.validateSignupData(body);
    await this.hashPassword(body);

    const createdUser = await this.dataSource.getRepository(User).save(body);

    return this.dataSource.getRepository(User).findOneOrFail({ where: { id: createdUser.id } });
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
      user_id: user!.id,
    }
  }

  public async refresh(body: RefreshTokenDTO, userId: string): Promise<SessionTokensDTO> {
    const token = await this.dataSource.getRepository(RefreshToken)
      .createQueryBuilder('token')
      .where('token.token = :token', { token: body.refresh_token })
      .andWhere('token.user_id = :user_id', { user_id: userId })
      .andWhere('token.expires_at > :now', { now: new Date() })
      .getOne();

    if (!token) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.generateUserTokens(token.user_id);
  }

  public async updatePsychologistDetail(userId: string, body: PsychologistDetailDTO): Promise<PsychologistDetail> {
    const userIsPsychologist = await this.dataSource.getRepository(User).existsBy({ id: userId, is_psychologist: true });

    if (!userIsPsychologist) {
      throw new BadRequestException('User is not a psychologist');
    }

    const detailBody = (await this.dataSource.getRepository(PsychologistDetail).findOneBy({ user: { id: userId } })) || new PsychologistDetail();

    detailBody.in_person = body.in_person;
    detailBody.online = body.online;
    detailBody.in_person_price = body.in_person_price;
    detailBody.online_price = body.online_price;
    detailBody.bio = body.bio;
    detailBody.register_number = body.register_number;
    detailBody.user = new User();
    detailBody.user.id = userId;

    const userDetail = await this.dataSource.getRepository(PsychologistDetail).save(detailBody);

    return this.dataSource.getRepository(PsychologistDetail).findOneOrFail({ where: { id: userDetail.id } });
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

    if (body.password !== body.password_confirmation) {
      throw new BadRequestException('Password and password confirmation do not match');
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

  private async hashPassword(body: SignupDTO): Promise<void> {
    const hashedPassword = await this.bcryptService.hash(body.password);

    body.password = hashedPassword;
  }

  private async generateUserTokens(userId: string): Promise<SessionTokensDTO> {
    const accessToken = this.jwtService.sign({ userId }, { expiresIn: '2d' });
    const refreshToken = uuidv4();

    await this.saveRefreshToken(refreshToken, userId);
    await this.saveAccessToken(accessToken, userId);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  private async saveRefreshToken(token: string, userId: string): Promise<RefreshToken> {
    const refreshTokenData = new RefreshToken();
    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + 3); // 3 days

    refreshTokenData.token = token;
    refreshTokenData.user = new User();
    refreshTokenData.user.id = userId;
    refreshTokenData.expires_at = expiresAt;

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