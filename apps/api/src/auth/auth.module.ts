import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { jwtConstants } from './constants'; // <--- Import logic
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      // Check Header FIRST, then Cookie
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => req?.cookies?.Authentication,
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret, // <--- USE CONSTANT
    });
  }

  async validate(payload: any) {
    console.log("🔍 Validating Payload:", payload); // Debug Log

    // Ensure payload has the ID (sub)
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid Token Structure');
    }

    const user = await this.prisma.user.findUnique({ 
        where: { id: payload.sub } 
    });

    if (!user || user.status === 'SUSPENDED') {
        console.error("⛔ User not found or suspended:", payload.sub);
        throw new UnauthorizedException('Account access restricted');
    }

    // Attach to request
    return { userId: user.id, email: user.email, role: user.role };
  }
}