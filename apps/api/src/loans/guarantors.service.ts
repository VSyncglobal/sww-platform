import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GuarantorStatus, LoanStatus, Prisma, Guarantor } from '@prisma/client';

@Injectable()
export class GuarantorsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. REQUEST A GUARANTOR (Updated for Email-First Flow)
  async requestGuarantee(loanId: string, guarantorEmail: string, amount: number) {
    const loan = await this.prisma.loan.findUnique({ 
        where: { id: loanId },
        include: { user: true }
    });
    if (!loan) throw new NotFoundException('Loan not found');

    // Rule: Cannot guarantee self
    if (loan.user.email === guarantorEmail) {
        throw new BadRequestException('You cannot guarantee your own loan');
    }

    // Rule: Loan must be in correct state
    if (loan.status !== LoanStatus.PENDING_GUARANTORS) {
      throw new BadRequestException('This loan is not accepting guarantors at this stage.');
    }

    // Rule: No Duplicate Requests for this email
    const existing = await this.prisma.guarantor.findFirst({
      where: { loanId, guarantorEmail }
    });
    if (existing) throw new ConflictException('This member has already been invited.');

    return this.prisma.guarantor.create({
      data: {
        loanId,
        guarantorEmail, // <--- FIXED: Using Email
        amountLocked: amount,
        status: GuarantorStatus.PENDING_ADMIN_CHECK // Start with Silent Check
      }
    });
  }

  // 2. ACCEPT GUARANTEE (Atomic Lock & Trigger)
  async acceptGuarantee(guaranteeId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      // A. Fetch Guarantee Request with User (if linked)
      const request = await tx.guarantor.findUnique({
        where: { id: guaranteeId },
        include: { user: { include: { wallet: true } } }
      });

      if (!request) throw new NotFoundException('Guarantee request not found');

      // B. Verify Identity (Email Match) if User isn't linked yet
      const acceptor = await tx.user.findUnique({ 
          where: { id: userId },
          include: { wallet: true }
      });

      if (!acceptor) throw new NotFoundException('User profile not found');

      if (acceptor.email !== request.guarantorEmail) {
          throw new BadRequestException('You are not the intended recipient of this request.');
      }

      // C. Check Status
      if (request.status !== GuarantorStatus.PENDING_GUARANTOR_ACTION) {
          throw new BadRequestException('Request is not pending your action (might be waiting for admin or already processed).');
      }

      // D. Verify Financial Health (Using Acceptor's Wallet)
      const wallet = acceptor.wallet;
      if (!wallet) throw new BadRequestException('Guarantor wallet not found. Cannot lock funds.');

      const freeBalance = Number(wallet.savingsBalance) - Number(wallet.lockedSavings);
      const amountToLock = Number(request.amountLocked);

      if (freeBalance < amountToLock) {
        throw new BadRequestException(`Insufficient free savings. Available: ${freeBalance}, Required: ${amountToLock}`);
      }

      // E. Lock the Funds (Shadow Balance)
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { lockedSavings: { increment: amountToLock } }
      });

      // F. Update Status & Link User (if not already linked)
      const updatedGuarantee = await tx.guarantor.update({
        where: { id: guaranteeId },
        data: { 
            status: GuarantorStatus.ACCEPTED,
            userId: acceptor.id 
        }
      });

      // G. CRITICAL: Check if Loan is now Fully Covered
      await this.checkLoanReadiness(request.loanId, tx);

      return updatedGuarantee;
    });
  }

  // 3. REJECT GUARANTEE
  async rejectGuarantee(guaranteeId: string, userId: string) {
    const request = await this.prisma.guarantor.findUnique({ where: { id: guaranteeId } });
    
    if (!request) throw new NotFoundException('Request not found');
    
    // Identity Check
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.email !== request.guarantorEmail) {
        throw new BadRequestException('Not authorized');
    }

    return this.prisma.guarantor.update({
      where: { id: guaranteeId },
      data: { status: GuarantorStatus.REJECTED }
    });
  }

  // 4. GET INCOMING REQUESTS
  async getIncomingRequests(userId: string) {
    // We need the user's email to find their requests
    const user = await this.prisma.user.findUnique({ 
        where: { id: userId },
        select: { email: true }
    });

    if (!user) return [];

    return this.prisma.guarantor.findMany({
      where: {
        guarantorEmail: user.email, // <--- Match by Email
        status: GuarantorStatus.PENDING_GUARANTOR_ACTION // Only show if Admin/Finance approved it
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
      .filter((g: Guarantor) => g.status === GuarantorStatus.ACCEPTED)
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