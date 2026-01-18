import { Controller, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('governance')
@UseGuards(AuthGuard('jwt'))
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  // 1. Request Withdrawal (Any Member)
  @Post('withdraw')
  requestWithdrawal(@Request() req: any, @Body() body: { amount: number; reason: string; destination: string }) {
    return this.governanceService.requestWithdrawal(req.user.userId, body.amount, body.reason, body.destination);
  }

  // 2. Verify Request (Finance Officer)
  @Post('verify/:id')
  verifyRequest(@Request() req: any, @Param('id') requestId: string) {
    return this.governanceService.verifyRequest(requestId, req.user.userId);
  }

  // 3. Approve Request (Chairperson)
  @Post('approve/:id')
  approveRequest(@Request() req: any, @Param('id') requestId: string) {
    return this.governanceService.approveRequest(requestId, req.user.userId);
  }

  // 4. Disburse Funds (Treasurer)
  @Post('disburse/:id')
  disburseFunds(@Request() req: any, @Param('id') requestId: string) {
    return this.governanceService.disburseFunds(requestId, req.user.userId);
  }
}