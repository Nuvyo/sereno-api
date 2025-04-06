import { Body, Controller, Delete, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { PsychologistDetailDTO, RefreshTokenDTO, SigninDTO, SignupDTO } from '@dtos/auth.dto';
import { AuthService } from '@modules/auth/auth.service';
import { Request } from 'express';
import { AuthGuard } from '@core/guards/auth.guard';

@Controller('v1/auth')
export class AuthController {

  constructor(private readonly authService: AuthService) {}

  @Get('/me')
  @UseGuards(AuthGuard)
  public me(@Req() req: Request) {
    return this.authService.me(req.userId);
  }

  @Post('/signup')
  public signup(@Body() body: SignupDTO) {
    return this.authService.signup(body);
  }

  @Post('/signin')
  public signin(@Body() body: SigninDTO) {
    return this.authService.signin(body);
  }

  @Post('/refresh')
  @UseGuards(AuthGuard)
  public refresh(@Req() req: Request, @Body() body: RefreshTokenDTO) {
    return this.authService.refresh(body, req.userId);
  }

  @Put('/psychologist-detail')
  @UseGuards(AuthGuard)
  public updatePsychologistDetail(@Req() req: Request, @Body() body: PsychologistDetailDTO): Promise<PsychologistDetailDTO> {
    return this.authService.updatePsychologistDetail(req.userId, body);
  }

  @Delete('/signout')
  @UseGuards(AuthGuard)
  public logout(@Req() req: Request) {
    return this.authService.logout(req.userId);
  }

  @Delete('/cancel-account')
  @UseGuards(AuthGuard)
  public revoke(@Req() req: Request) {
    return this.authService.cancelAccount(req.userId);
  }

}