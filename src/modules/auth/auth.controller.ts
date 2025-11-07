import { Body, Controller, Delete, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { MeResponseDTO, RefreshTokenDTO, SigninDTO, SigninResponseDTO, SignupDTO, UpdateMeDTO } from '../auth/auth.dto';
import { AuthService } from '../auth/auth.service';
import { Request } from 'express';
import { AuthGuard } from '../../core/guards/auth.guard';
import { BaseMessageDTO } from '../../core/dtos/generic.dto';

@Controller('v1/auth')
export class AuthController {

  constructor(private readonly authService: AuthService) {}

  @Get('/me')
  @UseGuards(AuthGuard)
  public getMe(@Req() req: Request): Promise<MeResponseDTO> {
    return this.authService.getMe(req.userId);
  }

  @Post('/signup')
  public signup(@Body() body: SignupDTO): Promise<BaseMessageDTO> {
    return this.authService.signup(body);
  }

  @Post('/signin')
  public signin(@Body() body: SigninDTO): Promise<SigninResponseDTO> {
    return this.authService.signin(body);
  }

  @Post('/signout')
  @UseGuards(AuthGuard)
  public logout(@Req() req: Request): Promise<BaseMessageDTO> {
    return this.authService.logout(req.userId);
  }

  @Post('/refresh')
  @UseGuards(AuthGuard)
  public refresh(@Req() req: Request, @Body() body: RefreshTokenDTO): Promise<RefreshTokenDTO> {
    return this.authService.refresh(body, req.userId);
  }

  @Put('/me')
  @UseGuards(AuthGuard)
  public updateMe(@Req() req: Request, @Body() body: UpdateMeDTO): Promise<BaseMessageDTO> {
    return this.authService.updateMe(req.userId, body);
  }

  @Delete('/cancel-account')
  @UseGuards(AuthGuard)
  public revoke(@Req() req: Request): Promise<BaseMessageDTO> {
    return this.authService.cancelAccount(req.userId);
  }

}
