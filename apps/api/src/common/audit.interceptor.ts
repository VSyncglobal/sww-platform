// apps/api/src/common/audit.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const user = req.user; // Attached by JwtStrategy

    // Only Audit State-Changing Methods (POST, PATCH, DELETE)
    if (['POST', 'PATCH', 'DELETE'].includes(method) && user) {
      return next.handle().pipe(
        tap(async () => {
          try {
            await prisma.auditLog.create({
              data: {
                userId: user.id,
                action: `${method} ${req.route.path}`,
                details: JSON.stringify(req.body), // Be careful with passwords here!
                ipAddress: req.ip || 'unknown',
              }
            });
            console.log(`[AUDIT] Recorded action by ${user.email}`);
          } catch (err) {
            console.error('[AUDIT FAIL]', err);
          }
        }),
      );
    }

    return next.handle();
  }
}