import { Injectable, BadRequestException, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoanStatus, TransactionType, TransactionStatus, PaymentProvider } from '@prisma/client';

@Injectable()
export class LoansService {
  private readonly logger = new Logger(LoansService.name);

  constructor(private readonly prisma: PrismaService) {}

  // --- 1. APPLICATION LOGIC (Member) ---
  async apply(userId: string, amount: number) {
    const amountDec = Number(amount);

    // Fetch Context
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true, loans: true }
    });

    if (!user || !user.wallet) throw new BadRequestException('User profile incomplete');

    // Gatekeeper: Active Loan Check
    const activeLoan = user.loans.find(l => 
      ['PENDING_GUARANTORS', 'PENDING_VERIFICATION', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE'].includes(l.status)
    );
    if (activeLoan) throw new ConflictException('You already have an active or pending loan.');

    // Gatekeeper: Tenure Check (> 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    if (user.createdAt > sixMonthsAgo) {
        throw new BadRequestException('Membership tenure must be > 6 months.');
    }

    // Gatekeeper: Savings Threshold (>= 10,000)
    const totalSavings = Number(user.wallet.savingsBalance);
    if (totalSavings < 10000) {
        throw new BadRequestException(`Minimum savings of KES 10,000 required. Current: ${totalSavings}`);
    }

    // Gatekeeper: Limit Calculation (80% Rule)
    const maxLoan = totalSavings * 0.80;
    if (amountDec > maxLoan) {
        throw new BadRequestException(`Loan exceeds limit. Max allowed: ${maxLoan}`);
    }

    // Calculation Logic
    const interest = amountDec * 0.05; // 5% Flat
    const totalDue = amountDec + interest;

    // Create Application
    return await this.prisma.loan.create({
      data: {
        userId: user.id,
        principal: amountDec,
        interest: interest,
        totalDue: totalDue,
        balance: totalDue,
        status: LoanStatus.PENDING_GUARANTORS,
      }
    });
  }

  // --- 2. VERIFICATION LOGIC (Finance Officer) ---
  async verify(loanId: string) {
    const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');
    
    if (loan.status !== 'PENDING_VERIFICATION') {
      throw new BadRequestException(`Invalid transition. Loan is at ${loan.status}`);
    }

    return await this.prisma.loan.update({
      where: { id: loanId },
      data: { status: LoanStatus.PENDING_APPROVAL }
    });
  }

  // --- 3. APPROVAL LOGIC (Chairperson) ---
  async approve(loanId: string) {
    const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');

    if (loan.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Invalid transition. Loan is at ${loan.status}`);
    }

    return await this.prisma.loan.update({
      where: { id: loanId },
      data: { status: LoanStatus.APPROVED }
    });
  }

  // --- 4. REJECTION LOGIC ---
  async reject(loanId: string, reason: string) {
    return await this.prisma.loan.update({
      where: { id: loanId },
      data: { status: LoanStatus.REJECTED }
    });
  }

  // --- 5. DISBURSEMENT LOGIC (Treasurer) ---
  async disburse(loanId: string) {
    const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');

    if (loan.status !== 'APPROVED') {
      throw new BadRequestException('Loan is not approved for disbursement');
    }

    const now = new Date();
    const dueDate = new Date();
    dueDate.setDate(now.getDate() + 30); // Strict 30 Day Policy

    return await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: loan.userId } });
      if (!wallet) throw new NotFoundException('User wallet not found.');

      // Update Loan
      const activeLoan = await tx.loan.update({
        where: { id: loanId },
        data: { 
          status: LoanStatus.ACTIVE, 
          disbursedAt: now,
          dueDate: dueDate
        }
      });

      // Update Wallet Liability
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { loanBalance: { increment: loan.totalDue } }
      });

      // Create Transaction
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount: loan.principal,
          type: TransactionType.LOAN_DISBURSEMENT,
          status: TransactionStatus.COMPLETED,
          provider: PaymentProvider.MPESA,
          referenceCode: `LOAN-${loan.id.substring(0, 8).toUpperCase()}`,
          description: `Disbursement of Loan #${loan.id}`
        }
      });

      return activeLoan;
    });
  }

  // --- 6. REPAYMENT LOGIC ---
  async repay(loanId: string, amount: number) {
    const payment = Number(amount);
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { user: { include: { wallet: true } }, guarantors: true }
    });

    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status !== 'ACTIVE' && loan.status !== 'DEFAULTED') throw new BadRequestException('Loan not active');

    const wallet = loan.user.wallet;
    if (!wallet) throw new NotFoundException('Wallet not found');
    
    // Logic: Split Payment
    let remainingPayment = payment;
    let loanDeduction = 0;
    let savingsAddition = 0;
    const currentBalance = Number(loan.balance);

    if (remainingPayment >= currentBalance) {
      loanDeduction = currentBalance;
      savingsAddition = remainingPayment - currentBalance;
    } else {
      loanDeduction = remainingPayment;
    }

    return await this.prisma.$transaction(async (tx) => {
      // Update Loan
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          balance: { decrement: loanDeduction },
          status: (loanDeduction === currentBalance) ? LoanStatus.COMPLETED : loan.status
        }
      });

      // Update Wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          loanBalance: { decrement: loanDeduction },
          savingsBalance: { increment: savingsAddition }
        }
      });
      
      // If Fully Paid -> Release Guarantors
      if (updatedLoan.status === LoanStatus.COMPLETED) {
        for (const g of loan.guarantors) {
          if (g.status === 'ACCEPTED') {
             await tx.wallet.update({
               where: { userId: g.userId },
               data: { lockedSavings: { decrement: g.amountLocked } }
             });
             await tx.guarantor.update({
               where: { id: g.id },
               data: { status: 'RELEASED' }
             });
          }
        }
      }

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount: payment,
          type: TransactionType.LOAN_REPAYMENT,
          status: TransactionStatus.COMPLETED,
          referenceCode: `PAY-${Date.now()}`,
          description: `Repayment for Loan #${loan.id}`
        }
      });

      return { updatedLoan, savingsAdded: savingsAddition };
    });
  }
// 7. AUTOMATION: APPLY PENALTY (Day 31+)
  async applyOverduePenalty(loanId: string) {
    return this.prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({ where: { id: loanId } });
      if (!loan) return;

      // 10% of Current Balance
      const penaltyAmount = Number(loan.balance) * 0.10; 
      
      // Update Loan
      await tx.loan.update({
        where: { id: loanId },
        data: {
          balance: { increment: penaltyAmount },
          totalDue: { increment: penaltyAmount },
        }
      });

      // <--- FIX: Safe Wallet Fetch
      const wallet = await tx.wallet.findUnique({ where: { userId: loan.userId } });
      
      if (wallet) {
        // Only create transaction if wallet exists
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            amount: penaltyAmount,
            type: TransactionType.LOAN_PENALTY,
            status: TransactionStatus.COMPLETED,
            referenceCode: `PEN-${Date.now()}`,
            description: `10% Penalty for Overdue Loan #${loan.id}`
          }
        });
        this.logger.warn(`Applied penalty of ${penaltyAmount} to Loan ${loanId}`);
      } else {
        this.logger.error(`Could not apply penalty transaction for Loan ${loanId}: Wallet not found.`);
      }
    });
  }

  // --- 8. AUTOMATION: MARK DEFAULT (Day 91+) ---
  async markLoanAsDefault(loanId: string) {
    return this.prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({ where: { id: loanId } });
      if (!loan) return;

      await tx.loan.update({
        where: { id: loanId },
        data: { status: LoanStatus.DEFAULTED }
      });

      await tx.user.update({
        where: { id: loan.userId },
        data: { status: 'DEFAULTED' }
      });

      this.logger.error(`🚨 Loan ${loanId} marked as DEFAULTED. User ${loan.userId} blocked.`);
    });
  }

  // --- 9. HELPER: FIND OVERDUE LOANS ---
  async getOverdueLoans() {
    const now = new Date();
    return this.prisma.loan.findMany({
      where: {
        status: LoanStatus.ACTIVE,
        dueDate: { lt: now }
      }
    });
  }

  // --- 10. GET ELIGIBILITY ---
  async checkEligibility(userId: string) {
     const user = await this.prisma.user.findUnique({
       where: { id: userId },
       include: { wallet: true, loans: true }
     });
     if(!user || !user.wallet) return { eligible: false, reason: 'Profile incomplete' };
     
     const savings = Number(user.wallet.savingsBalance);
     const limit = savings * 0.80;
     
     return {
       eligible: savings >= 10000,
       limit,
       savings
     };
  }

  // --- 11. FIND ALL ---
  async findAll(userId: string) {
    return this.prisma.loan.findMany({ where: { userId }, include: { guarantors: true } });
  }

  // --- 12. FIND ONE ---
  async findOne(id: string, userId: string) {
      return this.prisma.loan.findFirst({ where: { id, userId }, include: { guarantors: true } });
  }
  // --- 8. ADMIN: GET ALL LOANS ---
  async findAllAdmin() {
    return this.prisma.loan.findMany({
      orderBy: { appliedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phoneNumber: true,
            profile: {
              select: { firstName: true, lastName: true, nationalId: true }
            },
            wallet: {
              select: { savingsBalance: true }
            }
          }
        },
        guarantors: true
      }
    });
  }
}