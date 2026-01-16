// apps/api/src/auth/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Get required roles for this route
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. If no roles defined, allow public access (or protected by just JWT)
    if (!requiredRoles) {
      return true;
    }

    // 3. Get User from Request (Attached by JwtStrategy)
    const { user } = context.switchToHttp().getRequest();

    // 4. Check Match
    const hasRole = requiredRoles.some((role) => user.role === role);
    
    if (!hasRole) {
      throw new ForbiddenException('Access Denied: Insufficient Governance Level');
    }
    
    return true;
  }
}