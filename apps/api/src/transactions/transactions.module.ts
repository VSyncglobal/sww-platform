// apps/api/src/transactions/transactions.module.ts
import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';

@Module({
  controllers: [TransactionsController], // <--- MUST BE HERE
  providers: [TransactionsService],      // <--- MUST BE HERE
  exports: [TransactionsService],
})
export class TransactionsModule {}