import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { jwtConstants } from './constants';
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
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid Token Structure');
    }

    // Security: Check if user still exists and is not BANNED
    const user = await this.prisma.user.findUnique({ 
        where: { id: payload.sub } 
    });

    if (!user || user.status === 'SUSPENDED') {
        throw new UnauthorizedException('Account access restricted');
    }

    // This object is attached to req.user in Controllers
    return { userId: user.id, email: user.email, role: user.role };
  }
}