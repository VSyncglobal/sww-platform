import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @Roles(Role.MEMBER, Role.SUPER_ADMIN)
  findAll(@Request() req: any) {
    return this.transactionsService.findAll(req.user.userId);
  }

  // M-Pesa Callback Simulation
  @Post('deposit')
  @Roles(Role.MEMBER, Role.SUPER_ADMIN)
  deposit(@Request() req: any, @Body() body: { amount: number, phoneNumber: string }) {
    return this.transactionsService.processDeposit(req.user.userId, body.amount, `SIM-${Date.now()}`);
  }

  // --- ADMIN ENDPOINTS ---

  @Post('deposit/manual')
  @Roles(Role.TREASURER, Role.SUPER_ADMIN)
  manualDeposit(@Request() req: any, @Body() body: { email: string, amount: number, ref: string }) {
    return this.transactionsService.processManualDeposit(req.user.userId, body.email, body.amount, body.ref);
  }

  @Get('admin/all')
  // FIX: Added CHAIRPERSON and SECRETARY to allowed roles for Logs
  @Roles(Role.TREASURER, Role.FINANCE_OFFICER, Role.SUPER_ADMIN, Role.CHAIRPERSON, Role.SECRETARY)
  findAllAdmin() {
    return this.transactionsService.findAllAdmin();
  }
}