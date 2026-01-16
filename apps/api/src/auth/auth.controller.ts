// apps/api/src/auth/auth.controller.ts
import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express'; // <--- CHANGED: Added 'type'
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() response: Response) {
    // 1. Authenticate User
    const { access_token, user } = await this.authService.login(loginDto);

    // 2. Set HttpOnly Cookie (The Security Fortress)
    // This cookie cannot be read by JavaScript on the client side (prevents XSS)
    response.cookie('Authentication', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // True in Prod (HTTPS), False in Dev
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 Day
    });

    // 3. Return User Info (Without Password)
    return response.status(HttpStatus.OK).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.profile?.firstName,
      },
    });
  }
  
  @Post('logout')
  async logout(@Res() response: Response) {
    response.clearCookie('Authentication');
    return response.status(HttpStatus.OK).json({ message: 'Logged out successfully' });
  }
}