// apps/api/src/loans/guarantors.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient, GuaranteeStatus } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class GuarantorsService {

  // 1. REQUEST A GUARANTOR
  async requestGuarantee(loanId: string, guarantorId: string, amount: number) {
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');

    if (loan.userId === guarantorId) {
        throw new BadRequestException('You cannot guarantee your own loan');
    }

    return await prisma.guarantor.create({
      data: {
        loanId,
        userId: guarantorId,
        amountLocked: amount,
        status: GuaranteeStatus.PENDING
      }
    });
  }

// 2. ACCEPT GUARANTEE (THE SHADOW LOCK)
  async acceptGuarantee(guaranteeId: string, userId: string) {
    // A. Verify Request
    const request = await prisma.guarantor.findUnique({
      where: { id: guaranteeId },
      include: { user: { include: { wallet: true } } }
    });

    if (!request) throw new NotFoundException('Request not found');
    if (request.userId !== userId) throw new BadRequestException('Not authorized');
    if (request.status !== 'PENDING') throw new BadRequestException('Request already processed');

    // B. Verify Financial Health
    const wallet = request.user.wallet;
    
    // --- FIX: NULL CHECK ADDED HERE ---
    if (!wallet) {
      throw new BadRequestException('Guarantor wallet not found. Cannot lock funds.');
    }
    // ----------------------------------

    const freeBalance = Number(wallet.savingsBalance) - Number(wallet.lockedSavings);
    const amountToLock = Number(request.amountLocked);

    if (freeBalance < amountToLock) {
      throw new BadRequestException(`Insufficient free savings. Available: ${freeBalance}, Required: ${amountToLock}`);
    }

    // C. ATOMIC LOCKING
    return await prisma.$transaction(async (tx) => {
      // Lock the funds (Increase Shadow Balance)
      await tx.wallet.update({
        where: { id: wallet.id }, // Safe to access .id now
        data: { lockedSavings: { increment: amountToLock } }
      });

      // Update Status
      return await tx.guarantor.update({
        where: { id: guaranteeId },
        data: { status: GuaranteeStatus.ACCEPTED }
      });
    });
  }
}