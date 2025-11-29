import { Body, Controller, Delete, Get, Patch, Post, Req, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { MeResponseDTO, SigninDTO, SignupDTO, UpdateMeDTO } from '../auth/auth.dto';
import { AuthService } from '../auth/auth.service';
import { Request, Response } from 'express';
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
  public async signin(@Body() body: SigninDTO, @Res() response: Response): Promise<void> {
    const session = await this.authService.signin(body, response);

    response.json(session);
  }

  @Post('/signout')
  @UseGuards(AuthGuard)
  public logout(@Req() req: Request): Promise<BaseMessageDTO> {
    return this.authService.logout(req.userId);
  }

  @Patch('/me')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, skipMissingProperties: true }))
  public updateMe(@Req() req: Request, @Body() body: UpdateMeDTO): Promise<BaseMessageDTO> {
    return this.authService.updateMe(req.userId, body);
  }

  @Delete('/cancel-account')
  @UseGuards(AuthGuard)
  public revoke(@Req() req: Request): Promise<BaseMessageDTO> {
    return this.authService.cancelAccount(req.userId);
  }

}
