import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsScheduler {
  private readonly logger = new Logger(ReportsScheduler.name);

  constructor(private prisma: PrismaService) {}

  // RUNS: 1st day of every month at midnight
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async generateMonthlyReports() {
    this.logger.log('📊 Starting Monthly Report Generation...');
    
    const date = new Date();
    date.setMonth(date.getMonth() - 1); // Previous Month
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const users = await this.prisma.user.findMany({ include: { wallet: true } });

    for (const user of users) {
      if (!user.wallet) continue;

      // 1. Calculate totals from Transactions
      const aggregations = await this.prisma.transaction.groupBy({
        by: ['type'],
        where: {
          walletId: user.wallet.id,
          createdAt: {
            gte: new Date(date.getFullYear(), date.getMonth(), 1),
            lt: new Date(date.getFullYear(), date.getMonth() + 1, 1),
          },
        },
        _sum: { amount: true },
      });

      const savings = Number(aggregations.find(a => a.type === 'DEPOSIT')?._sum.amount || 0);
      const loans = Number(aggregations.find(a => a.type === 'LOAN_DISBURSEMENT')?._sum.amount || 0);

      // 2. Upsert Report
      await this.prisma.monthlyReport.upsert({
        where: { userId_month: { userId: user.id, month: monthKey } },
        update: { totalSaved: savings, totalBorrowed: loans, netPosition: savings - loans },
        create: {
          userId: user.id,
          month: monthKey,
          totalSaved: savings,
          totalBorrowed: loans,
          netPosition: savings - loans,
        },
      });
    }
    this.logger.log(`✅ Reports generated for ${monthKey}`);
  }
}