import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@lib/decorators/current-user.decorator';
import { JwtAuthGuard } from '@lib/guards/jwt-auth.guard';
import { User } from '@typeorm/entities';
import { LoginReqDto } from './dto/req/login-req.dto';
import { RefreshTokenReqDto } from './dto/req/refresh-token-req.dto';
import { RegisterReqDto } from './dto/req/register-req.dto';
import { TokenPairResDto } from './dto/res/token-pair-res.dto';
import { UserResDto } from './dto/res/user-res.dto';
import { JwtUser } from './strategies/jwt.strategy';
import { AuthService } from './services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @SerializeOptions({ type: TokenPairResDto })
  register(@Body() dto: RegisterReqDto): Promise<TokenPairResDto> {
    return this.authService.register(dto);
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({ type: TokenPairResDto })
  login(
    @Body() _dto: LoginReqDto,
    @Request() req: { user: User },
  ): Promise<TokenPairResDto> {
    return this.authService.login(req.user);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({ type: TokenPairResDto })
  refresh(@Body() dto: RefreshTokenReqDto): Promise<TokenPairResDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @SerializeOptions({ type: UserResDto })
  me(@CurrentUser() user: JwtUser): UserResDto {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(
    @Body() dto: RefreshTokenReqDto,
    @CurrentUser() user: JwtUser,
  ): Promise<void> {
    return this.authService.logout(dto.refreshToken, user.id);
  }
}
