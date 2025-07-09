import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Modality, User } from '@core/entities/user.entity';
import { SigninDTO, RefreshTokensResponseDTO, SignupDTO, RefreshTokenDTO, SigninResponseDTO, MeResponseDTO, UpdateMeDTO } from '@modules/auth/auth.dto';
import { BcryptService } from '@core/services/bcrypt.service';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { RefreshToken } from '@core/entities/refresh-token.entity';
import { AccessToken } from '@core/entities/access-token.entity';
import { BaseMessageDTO } from '@core/dtos/generic.dto';
import { Address } from '@core/entities/address.entity';

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
      email: user.email
    };

    if (user.psychologist && user.public) {
      data.crp = user.crp;
      data.modality = user.modality;
      data.sessionCost = user.sessionCost;
      data.bio = user.bio;

      if ([Modality.InPerson, Modality.Both].includes(user.modality)) {
        const address = await this.dataSource.getRepository(Address).findOne({ where: { user: { id: user.id } } });

        data.address = new Address();
        data.address.street = address!.street;
        data.address.number = address!.number;
        data.address.city = address!.city;
        data.address.state = address!.state;
        data.address.countryCode = address!.countryCode;
        data.address.postalCode = address!.postalCode;
        data.address.complement = address!.complement;
      }
    }

    return data;
  }

  public async updateMe(userId: string, body: UpdateMeDTO): Promise<Partial<User>> {
    const user = await this.dataSource.getRepository(User).findOneOrFail({ where: { id: userId } });

    if (body.name) {
      user.name = body.name;
    }

    // TODO: update email and password

    if (body.modality) {
      user.modality = body.modality;
    }

    if (body.crp) {
      user.crp = body.crp;
    }

    if (body.sessionCost) {
      user.sessionCost = body.sessionCost;
    }
    
    if (body.bio) {
      user.bio = body.bio;
    }

    await this.dataSource.getRepository(User).save(user);

    return { id: user.id };
  }

  public async signup(body: SignupDTO): Promise<BaseMessageDTO> {
    await this.validateSignupData(body);
    await this.hashPassword(body);

    const data = new User();

    data.name = body.name;
    data.email = body.email;
    data.password = body.password;

    if (body.psychologist && body.public) {
      data.psychologist = body.psychologist;
      data.public = body.public;
      data.crp = body.crp;
      data.modality = body.modality;
      data.sessionCost = body.sessionCost;
      data.bio = body.bio;
  
      if (body.address) {
        data.address = new Address();
        data.address.street = body.address.street;
        data.address.number = body.address.number;
        data.address.city = body.address.city;
        data.address.state = body.address.state;
        data.address.countryCode = body.address.countryCode;
        data.address.postalCode = body.address.postalCode;
        data.address.complement = body.address.complement;
      }
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

      if (!body.sessionCost) {
        throw new BadRequestException('Session cost is required');
      }

      if ([Modality.InPerson, Modality.Both].includes(body.modality)) {
        if (!body.address || !body.address.street || !body.address.number || !body.address.city || !body.address.state || !body.address.countryCode || !body.address.postalCode) {
          throw new BadRequestException('Address is required');
        }
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

  private async hashPassword(body: SignupDTO): Promise<void> {
    const hashedPassword = await this.bcryptService.hash(body.password);

    body.password = hashedPassword;
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
