import { Controller, Post, Patch, Body, Param, UseGuards, Request, Get } from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('governance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  @Post('withdraw')
  @Roles(Role.MEMBER)
  requestWithdrawal(@Request() req: any, @Body() body: { amount: number; reason: string; destination: string }) {
    return this.governanceService.requestWithdrawal(req.user.userId, body.amount, body.reason, body.destination);
  }

  // Admin: List all withdrawals (Simplified for Phase 1)
  @Get('withdrawals')
  @Roles(Role.FINANCE_OFFICER, Role.CHAIRPERSON, Role.TREASURER, Role.SUPER_ADMIN)
  async findAll(@Request() req: any) {
      // In production, this should call a service method with pagination/filtering
      // e.g. return this.governanceService.findAll(req.query);
      return []; 
  }

  @Patch('withdrawals/:id/verify')
  @Roles(Role.FINANCE_OFFICER, Role.SUPER_ADMIN)
  verify(@Param('id') id: string, @Request() req: any) {
    return this.governanceService.verifyRequest(id, req.user.userId);
  }

  @Patch('withdrawals/:id/approve')
  @Roles(Role.CHAIRPERSON, Role.SUPER_ADMIN)
  approve(@Param('id') id: string, @Request() req: any) {
    return this.governanceService.approveRequest(id, req.user.userId);
  }

  @Patch('withdrawals/:id/disburse')
  @Roles(Role.TREASURER, Role.SUPER_ADMIN)
  disburse(
    @Param('id') id: string, 
    @Request() req: any,
    @Body() body: { referenceCode?: string }
  ) {
    // Passes the manual reference code (if provided) to the service
    return this.governanceService.disburseFunds(id, req.user.userId, body.referenceCode);
  }
}