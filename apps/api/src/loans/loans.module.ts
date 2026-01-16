import { Module } from '@nestjs/common';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { GuarantorsService } from './guarantors.service'; // <--- IMPORT

@Module({
  controllers: [LoansController],
  providers: [LoansService, GuarantorsService], // <--- ADD HERE
  exports: [LoansService],
})
export class LoansModule {}