import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dtos/login.dto';
import { GoogleLoginDto } from '../dtos/google-login.dto';
import { RecuperarPasswordDto } from '../dtos/recuperar-password.dto';
import { RestablecerPasswordDto } from '../dtos/restablecer-password.dto';
import { Public } from '../decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('google')
  google(@Body() googleLoginDto: GoogleLoginDto) {
    return this.authService.googleLogin(googleLoginDto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('recuperar')
  recuperar(@Body() recuperarPasswordDto: RecuperarPasswordDto) {
    return this.authService.solicitarRecuperacion(recuperarPasswordDto.email);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('restablecer')
  restablecer(@Body() restablecerPasswordDto: RestablecerPasswordDto) {
    return this.authService.restablecerPassword(
      restablecerPasswordDto.token,
      restablecerPasswordDto.nueva_password,
    );
  }
}