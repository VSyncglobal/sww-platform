import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DarajaService } from '../common/daraja.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, DarajaService],
  exports: [TransactionsService],
})
export class TransactionsModule {}