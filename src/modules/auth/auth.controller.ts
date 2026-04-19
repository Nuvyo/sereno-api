import { Body, Controller, Delete, Get, Patch, Post, Query, Req, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { ConfirmCancelAccountDTO, MeResponseDTO, SigninDTO, SignupDTO, UpdateMeDTO, VerifyEmailDTO } from '../auth/auth.dto';
import { AuthService } from '../auth/auth.service';
import { Request, Response } from 'express';
import { AuthGuard } from '../../core/guards/auth.guard';
import { BaseMessageDTO } from '../../core/dtos/generic.dto';
import { IAuditContext } from '../../core/services/audit-log.service';

@Controller('v1/auth')
export class AuthController {

  constructor(private readonly authService: AuthService) {}

  @Get('/me')
  @UseGuards(AuthGuard)
  public getMe(@Req() req: Request): Promise<MeResponseDTO> {
    return this.authService.getMe(req.userId);
  }

  @Post('/signup')
  public signup(@Body() body: SignupDTO, @Req() req: Request): Promise<BaseMessageDTO> {
    const lang = I18nContext.current()?.lang ?? 'ptbr';

    return this.authService.signup(body, this.getContext(req), lang);
  }

  @Post('/signin')
  public async signin(@Body() body: SigninDTO, @Req() req: Request, @Res() response: Response): Promise<void> {
    const session = await this.authService.signin(body, response, this.getContext(req));

    response.json(session);
  }

  @Post('/signout')
  @UseGuards(AuthGuard)
  public signout(@Req() req: Request): Promise<BaseMessageDTO> {
    return this.authService.signout(req.userId, req.sessionId, this.getContext(req));
  }

  @Post('/signout-all')
  @UseGuards(AuthGuard)
  public signoutAll(@Req() req: Request): Promise<BaseMessageDTO> {
    return this.authService.signoutAll(req.userId, this.getContext(req));
  }

  @Patch('/me')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, skipMissingProperties: true }))
  public updateMe(@Req() req: Request, @Body() body: UpdateMeDTO): Promise<BaseMessageDTO> {
    return this.authService.updateMe(req.userId, body, this.getContext(req));
  }

  @Get('/verify-email')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  public verifyEmail(@Query() query: VerifyEmailDTO, @Req() req: Request): Promise<BaseMessageDTO> {
    return this.authService.verifyEmail(query.token, this.getContext(req));
  }

  @Delete('/cancel-account')
  @UseGuards(AuthGuard)
  public cancelAccount(@Req() req: Request): Promise<BaseMessageDTO> {
    const lang = I18nContext.current()?.lang ?? 'ptbr';
    
    return this.authService.cancelAccount(req.userId, this.getContext(req), lang);
  }

  @Get('/cancel-account/confirm')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  public confirmCancelAccount(@Query() query: ConfirmCancelAccountDTO, @Req() req: Request): Promise<BaseMessageDTO> {
    return this.authService.confirmCancelAccount(query.token, this.getContext(req));
  }

  private getContext(req: Request): IAuditContext {
    const forwarded = req.headers['x-forwarded-for'] as string;

    return {
      ip: forwarded?.split(',')[0]?.trim() ?? req.ip,
      userAgent: req.get('user-agent'),
    };
  }

}
