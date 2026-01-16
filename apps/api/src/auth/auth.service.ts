import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  // 1. LOGIN
  async signIn(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    if (!user) throw new UnauthorizedException('Invalid credentials');
    
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    // 2. CREATE PAYLOAD (Crucial: 'sub' must be the ID)
    const payload = { sub: user.id, email: user.email, role: user.role };
    
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    };
  }

  // 3. REGISTER
  async register(data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const user = await this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        wallet: { create: {} } // Create wallet automatically
      }
    });

    // Auto-login after register
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}