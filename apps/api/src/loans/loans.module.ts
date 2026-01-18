import { Module } from '@nestjs/common';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { GuarantorsService } from './guarantors.service';
import { LoansScheduler } from './loans.scheduler'; // <--- Import
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LoansController],
  providers: [LoansService, GuarantorsService, LoansScheduler], // <--- Add Here
  exports: [LoansService],
})
export class LoansModule {}