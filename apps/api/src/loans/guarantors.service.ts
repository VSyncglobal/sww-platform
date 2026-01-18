import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GuaranteeStatus, LoanStatus, Prisma, Guarantor } from '@prisma/client';

@Injectable()
export class GuarantorsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. REQUEST A GUARANTOR
  async requestGuarantee(loanId: string, guarantorId: string, amount: number) {
    const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');

    // Rule: Cannot guarantee self
    if (loan.userId === guarantorId) {
        throw new BadRequestException('You cannot guarantee your own loan');
    }

    // Rule: Loan must be in correct state
    if (loan.status !== LoanStatus.PENDING_GUARANTORS) {
      throw new BadRequestException('This loan is not accepting guarantors at this stage.');
    }

    // Rule: No Duplicate Requests
    const existing = await this.prisma.guarantor.findFirst({
      where: { loanId, userId: guarantorId }
    });
    if (existing) throw new ConflictException('This member is already a guarantor or has a pending request.');

    return this.prisma.guarantor.create({
      data: {
        loanId,
        userId: guarantorId,
        amountLocked: amount,
        status: GuaranteeStatus.PENDING
      }
    });
  }

  // 2. ACCEPT GUARANTEE (Atomic Lock & Trigger)
  async acceptGuarantee(guaranteeId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      // A. Fetch Guarantee Request
      const request = await tx.guarantor.findUnique({
        where: { id: guaranteeId },
        include: { user: { include: { wallet: true } } }
      });

      if (!request) throw new NotFoundException('Guarantee request not found');
      if (request.userId !== userId) throw new BadRequestException('Not authorized to accept this request');
      if (request.status !== GuaranteeStatus.PENDING) throw new BadRequestException('Request already processed');

      // B. Verify Financial Health
      const wallet = request.user.wallet;
      if (!wallet) throw new BadRequestException('Guarantor wallet not found. Cannot lock funds.');

      const freeBalance = Number(wallet.savingsBalance) - Number(wallet.lockedSavings);
      const amountToLock = Number(request.amountLocked);

      if (freeBalance < amountToLock) {
        throw new BadRequestException(`Insufficient free savings. Available: ${freeBalance}, Required: ${amountToLock}`);
      }

      // C. Lock the Funds (Shadow Balance)
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { lockedSavings: { increment: amountToLock } }
      });

      // D. Update Status
      const updatedGuarantee = await tx.guarantor.update({
        where: { id: guaranteeId },
        data: { status: GuaranteeStatus.ACCEPTED }
      });

      // E. CRITICAL: Check if Loan is now Fully Covered
      await this.checkLoanReadiness(request.loanId, tx);

      return updatedGuarantee;
    });
  }

  // 3. REJECT GUARANTEE
  async rejectGuarantee(guaranteeId: string, userId: string) {
    const request = await this.prisma.guarantor.findUnique({ where: { id: guaranteeId } });
    
    if (!request) throw new NotFoundException('Request not found');
    if (request.userId !== userId) throw new BadRequestException('Not authorized');

    return this.prisma.guarantor.update({
      where: { id: guaranteeId },
      data: { status: GuaranteeStatus.REJECTED }
    });
  }

  // 4. GET INCOMING REQUESTS (For the Guarantor Dashboard)
  async getIncomingRequests(userId: string) {
    return this.prisma.guarantor.findMany({
      where: {
        userId: userId, // I am the potential guarantor
        status: GuaranteeStatus.PENDING
      },
      include: {
        loan: {
          include: {
            user: { // The person asking for money
              select: {
                profile: {
                  select: { firstName: true, lastName: true }
                },
                email: true,
                phoneNumber: true
              }
            }
          }
        }
      }
    });
  }

  // --- HELPER: CHECK LOAN COVERAGE ---
  private async checkLoanReadiness(loanId: string, tx: Prisma.TransactionClient) {
    const loan = await tx.loan.findUnique({ 
        where: { id: loanId },
        include: { guarantors: true } 
    });

    if (!loan) return; 

    // Sum all ACCEPTED guarantees
    const totalGuaranteed = loan.guarantors
      .filter((g: Guarantor) => g.status === GuaranteeStatus.ACCEPTED)
      .reduce((sum: number, g: Guarantor) => sum + Number(g.amountLocked), 0);

    // If 100% Covered -> Move to Finance Verification
    if (totalGuaranteed >= Number(loan.principal)) {
        console.log(`✅ Loan ${loanId} fully guaranteed (${totalGuaranteed}/${loan.principal}). Moving to VERIFICATION.`);
        
        await tx.loan.update({
            where: { id: loanId },
            data: { status: LoanStatus.PENDING_VERIFICATION }
        });
    }
  }
}