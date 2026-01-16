import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { AuthGuard } from '@nestjs/passport'; 

// Use the standard Passport JWT Guard
@Controller('transactions')
@UseGuards(AuthGuard('jwt')) 
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
}