import { Controller, Post, Body, Get, UseGuards, Request, Logger } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('transactions')
export class TransactionsController {
  private readonly logger = new Logger(TransactionsController.name);

  constructor(private readonly transactionsService: TransactionsService) {}

  // --- PUBLIC: M-Pesa Callback (No Guards) ---
  @Post('callback/mpesa')
  async handleMpesaCallback(@Body() payload: any) {
    // 1. Basic Validation
    if (!payload?.Body?.stkCallback) {
        this.logger.error('Invalid Callback Payload received');
        return { result: 'fail' };
    }

    // 2. Delegate to Service
    // We do not await this to prevent Safaricom timeout, 
    // OR we await it if logic is fast. Prudent to await to catch DB errors.
    await this.transactionsService.processMpesaCallback(payload);

    // 3. Acknowledge Receipt to Safaricom
    return { result: 'ok' };
  }

  // --- AUTHENTICATED ROUTES ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @Roles(Role.MEMBER, Role.SUPER_ADMIN)
  findAll(@Request() req: any) {
    return this.transactionsService.findAll(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('deposit')
  @Roles(Role.MEMBER, Role.SUPER_ADMIN)
  deposit(@Request() req: any, @Body() body: { amount: number, phoneNumber: string }) {
    return this.transactionsService.initiateDeposit(req.user.userId, body.amount, body.phoneNumber);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('deposit/manual')
  @Roles(Role.TREASURER, Role.SUPER_ADMIN)
  manualDeposit(@Request() req: any, @Body() body: { email: string, amount: number, ref: string }) {
    return this.transactionsService.processManualDeposit(req.user.userId, body.email, body.amount, body.ref);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('admin/all')
  @Roles(Role.TREASURER, Role.FINANCE_OFFICER, Role.SUPER_ADMIN, Role.CHAIRPERSON, Role.SECRETARY)
  findAllAdmin() {
    return this.transactionsService.findAllAdmin();
  }
}