import { Controller, Request, Post, UseGuards, Get, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.strategy'; // <--- Now this import will work
import { LoginDto } from './dto/login.dto';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    // 1. Validate User
    // Note: ensure authService.validateUser returns the user object or null
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
        // We handle the error here or let the service throw it
        // Ideally authService.validateUser should return null if failed, 
        // or authService.login will throw if user is null.
        // Let's rely on authService.login logic which we fixed previously.
        return this.authService.login(loginDto); 
    }
    
    // 2. Generate Token
    // We pass the DTO because our updated Service handles the whole flow
    const result = await this.authService.login(loginDto);

    // 3. Set Cookie
    response.cookie('Authentication', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 Day
    });

    return result;
  }

  @UseGuards(JwtAuthGuard) // <--- Using the exported Guard
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