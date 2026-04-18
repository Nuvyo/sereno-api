import { Body, Controller, Delete, Get, Patch, Post, Req, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { MeResponseDTO, SigninDTO, SignupDTO, UpdateMeDTO } from '../auth/auth.dto';
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
    return this.authService.signup(body, this.getContext(req));
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

  @Delete('/cancel-account')
  @UseGuards(AuthGuard)
  public cancelAccount(@Req() req: Request): Promise<BaseMessageDTO> {
    return this.authService.cancelAccount(req.userId, this.getContext(req));
  }

  private getContext(req: Request): IAuditContext {
    const forwarded = req.headers['x-forwarded-for'] as string;

    return {
      ip: forwarded?.split(',')[0]?.trim() ?? req.ip,
      userAgent: req.get('user-agent'),
    };
  }

}
