import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { AuthGuard } from '@nestjs/passport'; 
import { Roles } from '../auth/roles.decorator'; // <--- ADDED
import { RolesGuard } from '../auth/roles.guard'; // <--- ADDED
import { Role } from '@prisma/client'; // <--- ADDED

// Use the standard Passport JWT Guard AND RolesGuard
@Controller('transactions')
@UseGuards(AuthGuard('jwt'), RolesGuard) // <--- UPDATED to include RolesGuard
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // 1. MAKE A DEPOSIT
  @Post('deposit')
  create(@Request() req: any, @Body() body: { amount: number; phoneNumber: string }) {
    // We generate a fake reference code for now since we aren't actually hitting M-Pesa yet
    const referenceCode = `REF-${Date.now()}`;
    
    // Pass the logged-in user's ID
    return this.transactionsService.processDeposit(req.user.userId, Number(body.amount), referenceCode);
  }

  // 2. GET MY HISTORY
  @Get()
  findAll(@Request() req: any) {
    return this.transactionsService.findAll(req.user.userId);
  }

  // 3. ADMIN: GET ALL TRANSACTIONS (LOGS)
  @Get('admin/all')
  @Roles(Role.CHAIRPERSON, Role.TREASURER, Role.SUPER_ADMIN, Role.FINANCE_OFFICER)
  findAllAdmin() {
    return this.transactionsService.findAllAdmin();
  }
}