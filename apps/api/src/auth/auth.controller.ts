import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() response: Response) {
    // 1. Get the token from the service
    const { access_token, user } = await this.authService.login(loginDto);

    // 2. Set the Cookie (Backup)
    response.cookie('Authentication', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, 
    });

    // 3. Return JSON (Crucial for Frontend)
    return response.status(HttpStatus.OK).json({
      message: 'Login successful',
      access_token: access_token, 
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        // REMOVED: firstName line to fix TypeScript error
      },
    });
  }
  
  @Post('logout')
  async logout(@Res() response: Response) {
    response.clearCookie('Authentication');
    return response.status(HttpStatus.OK).json({ message: 'Logged out successfully' });
  }
}