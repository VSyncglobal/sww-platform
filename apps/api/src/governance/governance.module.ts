import { Module } from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { GovernanceController } from './governance.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TransactionsModule } from '../transactions/transactions.module'; // Needed to execute the final transfer

@Module({
  imports: [PrismaModule, TransactionsModule],
  controllers: [GovernanceController],
  providers: [GovernanceService],
})
export class GovernanceModule {}