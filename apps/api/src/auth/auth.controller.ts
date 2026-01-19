import { Controller, Request, Post, UseGuards, Get, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.strategy';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto'; // <--- Added Import
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // FIX: Added this missing endpoint causing the 404 on Registration
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    // 1. Validate User (Check password)
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    
    // Note: If validateUser fails, it returns null. The actual login method below 
    // will throw 'UnauthorizedException' if user validation inside it fails again 
    // or if we passed invalid data. Ideally, we just call login directly if validation passes.
    
    // 2. Generate Token & Return
    const result = await this.authService.login(loginDto);

    // 3. Set Cookie (Optional redundancy for client-side storage)
    response.cookie('Authentication', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 Day
    });

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return this.authService.getUserProfile(req.user.userId);
  }
  
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: any) {
      return req.user;
  }
}