import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoansService } from './loans.service';

@Injectable()
export class LoansScheduler {
  private readonly logger = new Logger(LoansScheduler.name);

  constructor(private readonly loansService: LoansService) {}

  // Run every day at Midnight (00:00)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.log('🕛 Running Midnight Loan Compliance Check...');

    const overdueLoans = await this.loansService.getOverdueLoans();
    const now = new Date();

    for (const loan of overdueLoans) {
      if (!loan.dueDate) continue;
      
      const dueDate = new Date(loan.dueDate);
      const diffTime = Math.abs(now.getTime() - dueDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

      this.logger.debug(`Checking Loan ${loan.id}: ${diffDays} days overdue`);

      // 1. DEFAULT RULE (Day 91+)
      if (diffDays >= 91) {
        await this.loansService.markLoanAsDefault(loan.id);
      }
      
      // 2. PENALTY RULE (Day 31 - Only applied ONCE on the 31st day overdue)
      // We check if it's EXACTLY day 31 to avoid re-applying daily.
      // Alternatively, check if a penalty transaction already exists for this month.
      // For simplicity/robustness in MVP: We apply it if it's the first month overdue.
      else if (diffDays === 1) { // 1 Day AFTER Due Date (which is 30 days after creation)
         await this.loansService.applyOverduePenalty(loan.id);
      }
    }
  }
}