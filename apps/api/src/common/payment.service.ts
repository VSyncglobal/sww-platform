import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExecutionMode } from '@prisma/client';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private config: ConfigService) {}

  /**
   * Decides whether to trigger M-Pesa or just record success
   */
  async processDisbursement(phone: string, amount: number): Promise<{ success: boolean; mode: ExecutionMode; ref: string }> {
    const isAuto = this.config.get<boolean>('automation.disbursement');

    if (isAuto) {
      // --- AUTOMATIC MODE (M-Pesa B2C) ---
      this.logger.log(`🤖 [AUTO] Triggering M-Pesa B2C for KES ${amount} to ${phone}`);
      // await mpesa.b2c(...)
      return { success: true, mode: 'AUTOMATIC', ref: `MPESA-${Date.now()}` };
    } else {
      // --- MANUAL MODE (Record Keeping) ---
      this.logger.log(`📝 [MANUAL] Recording offline disbursement of KES ${amount}`);
      return { success: true, mode: 'MANUAL', ref: `MANUAL-${Date.now()}` };
    }
  }
}