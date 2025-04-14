import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '@core/entities/user.entity';
import { SigninDTO, SessionTokensDTO, SignupDTO, RefreshTokenDTO, SigninResponseDTO, MeDTO, PsychologistDetailDTO } from '@core/dtos/auth.dto';
import { BcryptService } from '@core/services/bcrypt.service';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { RefreshToken } from '@core/entities/refresh-token.entity';
import { AccessToken } from '@core/entities/access-token.entity';
import { BaseMessageDTO } from '@core/dtos/generic.dto';
import { PsychologistDetail } from '@core/entities/psychologist-detail.entity';

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

    if (user.isPsychologist) {
      const psychologistDetail = await this.dataSource.getRepository(PsychologistDetail).findOne({
        where: { user: { id: userId } },
        select: {}
      });

      if (psychologistDetail) {
        data['psychologistDetail'] = psychologistDetail;
      }
    }

    return data;
  }

  public async signup(body: SignupDTO): Promise<Partial<User>> {
    await this.validateSignupData(body);
    await this.hashPassword(body);

    const data: Partial<User> = { ...body };

    if (body.isPsychologist) {
      data.psychologistDetail = new PsychologistDetail();
    }

    const user = await this.dataSource.getRepository(User).save(data);

    return {
      id: user.id,
    };
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
    }
  }

  public async refresh(body: RefreshTokenDTO, userId: string): Promise<SessionTokensDTO> {
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

  public async updatePsychologistDetail(userId: string, body: PsychologistDetailDTO): Promise<PsychologistDetail> {
    await this.validatePsychologistDetailData(userId, body);

    const detailBody = await this.dataSource.getRepository(PsychologistDetail).findOneByOrFail({ user: { id: userId } });

    detailBody.inPerson = body.inPerson;
    detailBody.online = body.online;
    detailBody.bio = body.bio;
    detailBody.registerNumber = body.registerNumber;
    detailBody.inPerson = body.inPerson;
    detailBody.online = body.online;

    if (body.inPerson) {
      detailBody.inPersonPrice = body.inPersonPrice;
    }

    if (body.online) {
      detailBody.onlinePrice = body.onlinePrice;
    }

    detailBody.user = new User();
    detailBody.user.id = userId;

    const userDetail = await this.dataSource.getRepository(PsychologistDetail).save(detailBody);

    // TODO: criar job para validar o número de registro do psicólogo

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

    if (body.password !== body.passwordConfirmation) {
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

  private async validatePsychologistDetailData(userId: string, body: PsychologistDetailDTO): Promise<void> {
    if (!body.inPerson && !body.online) {
      throw new BadRequestException('At least one of in_person or online must be true');
    }

    const userIsPsychologist = await this.dataSource.getRepository(User).existsBy({ id: userId, isPsychologist: true });

    if (!userIsPsychologist) {
      throw new BadRequestException('User is not a psychologist');
    }
  }

}