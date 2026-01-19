import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy, AuthGuard } from '@nestjs/passport'; // Import AuthGuard
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService, 
  ) {
    super({
      // 1. Check Auth Header (Bearer), 2. Check Cookies
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => {
          let token = null;
          if (req && req.cookies) {
            token = req.cookies['Authentication'];
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      // FIX: Load secret from ConfigService with fallback
      secretOrKey: configService.get<string>('JWT_SECRET') || jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid Token Structure');
    }

    const user = await this.prisma.user.findUnique({ 
        where: { id: payload.sub } 
    });

    if (!user || user.status === 'SUSPENDED') {
        throw new UnauthorizedException('Account access restricted');
    }

    // This object attaches to req.user
    return { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
    };
  }
}

// FIX: Export this class so AuthController can import it
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}