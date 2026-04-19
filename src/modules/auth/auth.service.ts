import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../../core/entities/user.entity';
import {
  SigninDTO,
  SignupDTO,
  MeResponseDTO,
  UpdateMeDTO,
  ResendVerificationEmailDTO,
} from '../auth/auth.dto';
import { BcryptService } from '../../core/services/bcrypt.service';
import crypto from 'node:crypto';
import { BaseMessageDTO } from '../../core/dtos/generic.dto';
import { Session } from '../../core/entities/session.entity';
import { daysInMilliseconds } from '../../core/utils/utils';
import { Response } from 'express';
import { AuditLogService, IAuditContext } from '../../core/services/audit-log.service';
import { AuditAction } from '../../core/entities/audit-log.entity';
import { MailService } from '../../core/mail/mail.service';
import { DictionaryService } from '../../core/services/dictionary.service';

@Injectable()
export class AuthService {

  constructor(
    private readonly dataSource: DataSource,
    private readonly bcryptService: BcryptService,
    private readonly auditLogService: AuditLogService,
    private readonly mailService: MailService,
    private readonly dictionary: DictionaryService,
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

  public async updateMe(userId: string, body: UpdateMeDTO, context: IAuditContext = {}): Promise<BaseMessageDTO> {
    const user = await this.dataSource.getRepository(User).findOneOrFail({ where: { id: userId } });

    if (body.name !== undefined) user.name = body.name;

    if (body.currentPassword !== undefined && body.newPassword !== undefined) {
      const userWithPassword = await this.dataSource.getRepository(User).findOneOrFail({
        where: { id: userId },
        select: { id: true, password: true },
      });
      const isCurrentPasswordValid = await this.bcryptService.compare(body.currentPassword, userWithPassword.password);

      if (!isCurrentPasswordValid) {
        throw new BadRequestException({ key: 'auth.wrong_current_password' });
      }

      if (body.newPassword !== body.newPasswordConfirmation) {
        throw new BadRequestException({ key: 'auth.passwords_do_not_match' });
      }

      user.password = await this.bcryptService.hash(body.newPassword!);
    }

    await this.dataSource.getRepository(User).save(user);

    await this.auditLogService.log({ userId, action: AuditAction.UPDATE_PROFILE, ...context });

    return { message: { key: 'auth.profile_updated' } };
  }

  public async signup(body: SignupDTO, context: IAuditContext = {}, lang = 'ptbr'): Promise<BaseMessageDTO> {
    await this.validateSignupData(body);

    const user = await this.createUser(body, lang);

    await this.mailService.send(this.buildVerificationEmail(user, lang));
    await this.auditLogService.log({ userId: user.id, action: AuditAction.SIGNUP, ...context });

    return { message: { key: 'auth.signup_successful' } };
  }

  private buildVerificationEmail(user: User, lang: string) {
    const t = (key: string, args?: Record<string, unknown>) =>
      this.dictionary.translate(`auth.${key}`, args, lang);
    const verificationUrl = `${process.env.APP_URL}/verify-email?token=${user.emailVerificationToken}`;

    return {
      to: user.email,
      subject: t('verification_email_subject'),
      template: 'email-verification',
      context: {
        verificationUrl,
        greeting: t('verification_email_greeting', { name: user.name }),
        body: t('verification_email_body'),
        button: t('verification_email_button'),
        expiry: t('verification_email_expiry'),
        disclaimer: t('verification_email_disclaimer'),
        fallback: t('verification_email_fallback'),
      },
      userId: user.id,
    };
  }

  public async verifyEmail(token: string, context: IAuditContext = {}): Promise<BaseMessageDTO> {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { emailVerificationToken: token },
      select: { id: true, emailVerificationToken: true },
    });

    if (!user) {
      throw new BadRequestException({ key: 'auth.email_verification_invalid' });
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    await this.dataSource.getRepository(User).save(user);

    await this.auditLogService.log({ userId: user.id, action: AuditAction.EMAIL_VERIFICATION, ...context });

    return { message: { key: 'auth.email_verification_successful' } };
  }

  public async resendVerificationEmail(body: ResendVerificationEmailDTO, context: IAuditContext = {}, lang = 'ptbr'): Promise<BaseMessageDTO> {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { email: body.email },
      select: { id: true, email: true, name: true, emailVerified: true, emailVerificationToken: true, emailVerificationTokenExpiresAt: true },
    });

    if (!user || user.emailVerified) {
      return { message: { key: 'auth.verification_email_resent' } };
    }

    this.setVerificationToken(user);
    await this.dataSource.getRepository(User).save(user);
    await this.mailService.send(this.buildVerificationEmail(user, lang));
    await this.auditLogService.log({ userId: user.id, action: AuditAction.EMAIL_VERIFICATION_RESENT, ...context });

    return { message: { key: 'auth.verification_email_resent' } };
  }

  public async signin(body: SigninDTO, response: Response, context: IAuditContext = {}, lang = 'ptbr'): Promise<Session> {
    let user: User;

    try {
      user = await this.getAuthenticatedUser(body);
    } catch (e) {
      await this.auditLogService.log({ action: AuditAction.SIGNIN_FAILED, ...context });
      throw e;
    }

    if (!user.emailVerified) {
      const tokenExpired = !user.emailVerificationTokenExpiresAt || user.emailVerificationTokenExpiresAt < new Date();

      if (tokenExpired) {
        this.setVerificationToken(user);
        await this.dataSource.getRepository(User).save(user);
        await this.mailService.send(this.buildVerificationEmail(user, lang));
        throw new UnauthorizedException({ key: 'auth.email_not_verified_new_link_sent' });
      }

      throw new UnauthorizedException({ key: 'auth.email_not_verified' });
    }

    const session = await this.createUserSession(user.id);

    await this.auditLogService.log({ userId: user.id, action: AuditAction.SIGNIN, ...context });

    response.cookie('sid', session.token, {
      maxAge: session.maxAge * 1000,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return session;
  }

  public async signout(userId: string, sessionId: string, context: IAuditContext = {}): Promise<BaseMessageDTO> {
    await this.dataSource.getRepository(Session).delete({ id: sessionId, user: { id: userId } });

    await this.auditLogService.log({ userId, action: AuditAction.SIGNOUT, ...context });

    return {
      message: { key: 'auth.signout_successful' },
    };
  }

  public async signoutAll(userId: string, context: IAuditContext = {}): Promise<BaseMessageDTO> {
    await this.dataSource.getRepository(Session).delete({ user: { id: userId } });

    await this.auditLogService.log({ userId, action: AuditAction.SIGNOUT_ALL, ...context });

    return {
      message: { key: 'auth.signout_successful' },
    };
  }

  public async cancelAccount(userId: string, context: IAuditContext = {}, lang = 'ptbr'): Promise<BaseMessageDTO> {
    const user = await this.dataSource.getRepository(User).findOneOrFail({ where: { id: userId } });

    user.cancellationToken = crypto.randomBytes(50).toString('hex');
    await this.dataSource.getRepository(User).save(user);

    await this.mailService.send(this.buildCancellationEmail(user, user.cancellationToken, lang));
    await this.auditLogService.log({ userId, action: AuditAction.CANCEL_ACCOUNT_REQUESTED, ...context });

    return { message: { key: 'auth.cancel_account_email_sent' } };
  }

  public async confirmCancelAccount(token: string, context: IAuditContext = {}): Promise<BaseMessageDTO> {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { cancellationToken: token },
      select: { id: true, cancellationToken: true },
    });

    if (!user) {
      throw new BadRequestException({ key: 'auth.cancel_account_confirmation_invalid' });
    }

    await this.auditLogService.log({ userId: user.id, action: AuditAction.CANCEL_ACCOUNT, ...context });
    await this.dataSource.getRepository(User).delete({ id: user.id });

    return { message: { key: 'auth.account_cancellation_successful' } };
  }

  private buildCancellationEmail(user: User, token: string, lang: string) {
    const t = (key: string, args?: Record<string, unknown>) =>
      this.dictionary.translate(`auth.${key}`, args, lang);
    const confirmationUrl = `${process.env.APP_URL}/cancel-account/confirm?token=${token}`;

    return {
      to: user.email,
      subject: t('cancellation_email_subject'),
      template: 'account-cancellation',
      context: {
        confirmationUrl,
        greeting: t('cancellation_email_greeting', { name: user.name }),
        body: t('cancellation_email_body'),
        warning: t('cancellation_email_warning'),
        button: t('cancellation_email_button'),
        disclaimer: t('cancellation_email_disclaimer'),
        fallback: t('cancellation_email_fallback'),
      },
      userId: user.id,
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

  private setVerificationToken(user: User): void {
    user.emailVerificationToken = crypto.randomBytes(50).toString('hex');
    user.emailVerificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }

  private async createUser(body: SignupDTO, lang: string): Promise<User> {
    const data = new User();

    data.name = body.name;
    data.email = body.email;
    data.password = await this.bcryptService.hash(body.password);
    data.language = lang;
    data.emailVerified = process.env.NODE_ENV === 'test';
    this.setVerificationToken(data);

    return this.dataSource.getRepository(User).save(data);
  }

  private async getAuthenticatedUser(body: SigninDTO): Promise<User> {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { email: body.email },
      select: { id: true, name: true, email: true, password: true, emailVerified: true, emailVerificationToken: true, emailVerificationTokenExpiresAt: true },
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
