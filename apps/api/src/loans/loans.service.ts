// apps/api/src/loans/loans.service.ts
import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaClient, LoanStatus } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class LoansService {

  // --- 1. APPLICATION LOGIC (Member) ---
  async apply(userId: string, amount: number) {
    const amountDec = Number(amount);

    // Fetch Context
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true, loans: true }
    });

    if (!user || !user.wallet) throw new BadRequestException('User profile incomplete');

    // Gatekeeper: Active Loan Check
    const activeLoan = user.loans.find(l => 
      ['PENDING_VERIFICATION', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE'].includes(l.status)
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
    return await prisma.loan.create({
      data: {
        userId: user.id,
        principal: amountDec,
        interest: interest,
        totalDue: totalDue,
        balance: totalDue,
        status: LoanStatus.PENDING_VERIFICATION, // Step 1
      }
    });
  }

  // --- 2. VERIFICATION LOGIC (Finance Officer) ---
  async verify(loanId: string) {
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    
    if (!loan) throw new NotFoundException('Loan not found');
    
    // Strict State Machine Check
    if (loan.status !== 'PENDING_VERIFICATION') {
      throw new BadRequestException(`Invalid transition. Current status: ${loan.status}`);
    }

    return await prisma.loan.update({
      where: { id: loanId },
      data: { status: 'PENDING_APPROVAL' } // Move to Step 2
    });
  }

  // --- 3. APPROVAL LOGIC (Chairperson) ---
  async approve(loanId: string) {
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });

    if (!loan) throw new NotFoundException('Loan not found');

    // Strict State Machine Check
    if (loan.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Invalid transition. Current status: ${loan.status}`);
    }

    return await prisma.loan.update({
      where: { id: loanId },
      data: { status: 'APPROVED' } // Move to Step 3 (Ready for Disbursement)
    });
  }

  // --- 4. REJECTION LOGIC ---
  async reject(loanId: string, reason: string) {
    return await prisma.loan.update({
      where: { id: loanId },
      data: { status: 'REJECTED' }
    });
  }

// --- 5. DISBURSEMENT LOGIC (Treasurer) ---
  async disburse(loanId: string) {
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });

    if (!loan) throw new NotFoundException('Loan not found');

    if (loan.status !== 'APPROVED') {
      throw new BadRequestException('Loan is not approved for disbursement');
    }

    // Calculate Dates
    const now = new Date();
    const dueDate = new Date();
    dueDate.setDate(now.getDate() + 30); // Strict 30 Day Policy

    // ATOMIC TRANSACTION
    return await prisma.$transaction(async (tx) => {
      
      // 1. Fetch Wallet (Safe Check)
      const wallet = await tx.wallet.findUnique({ 
        where: { userId: loan.userId } 
      });

      if (!wallet) {
        throw new NotFoundException('User wallet not found. Cannot disburse.');
      }

      // 2. Activate the Loan
      const activeLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          status: 'ACTIVE',
          disbursedAt: now,
          dueDate: dueDate,
        }
      });

      // 3. Update User's Financial Liability
      await tx.wallet.update({
        where: { id: wallet.id }, // Use the wallet.id we just found
        data: {
          loanBalance: { increment: loan.totalDue }
        }
      });

      // 4. Log the "Money Out" Event
      await tx.transaction.create({
        data: {
          walletId: wallet.id, // Safe to use now
          amount: loan.principal,
          type: 'LOAN_DISBURSEMENT',
          status: 'COMPLETED',
          provider: 'MPESA',
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

    // 1. Fetch Loan & Wallet
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { user: { include: { wallet: true } } } // Deep fetch
    });

    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status !== 'ACTIVE' && loan.status !== 'DEFAULTED') {
      throw new BadRequestException('Loan is not active');
    }

    const wallet = loan.user.wallet;
    if (!wallet) throw new NotFoundException('Wallet not found');

    // 2. Calculate Allocations
    let remainingPayment = payment;
    let loanDedcution = 0;
    let savingsAddition = 0;

    const currentBalance = Number(loan.balance);

    if (remainingPayment >= currentBalance) {
      // FULL CLEARANCE (and maybe more)
      loanDedcution = currentBalance;
      savingsAddition = remainingPayment - currentBalance; // Excess goes to savings
    } else {
      // PARTIAL PAYMENT
      loanDedcution = remainingPayment;
    }

    // 3. EXECUTE TRANSACTION
    return await prisma.$transaction(async (tx) => {
      
      // A. Update Loan Record
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          balance: { decrement: loanDedcution },
          status: (loanDedcution === currentBalance) ? 'COMPLETED' : loan.status
        }
      });

      // B. Update Wallet (Liability Down, Assets Up if excess)
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          loanBalance: { decrement: loanDedcution },
          savingsBalance: { increment: savingsAddition }
        }
      });

      // C. Log the Transaction
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount: payment,
          type: 'LOAN_REPAYMENT',
          status: 'COMPLETED',
          referenceCode: `PAY-${Date.now()}`, // Simulated Ref
          description: `Repayment for Loan #${loan.id}`,
          metadata: {
            breakdown: {
              clearedDebt: loanDedcution,
              addedToSavings: savingsAddition
            }
          }
        }
      });

      return {
        message: savingsAddition > 0 ? 'Loan Cleared! Excess moved to savings.' : 'Payment Received',
        loanStatus: updatedLoan.status,
        remainingBalance: updatedLoan.balance,
        savingsAdded: savingsAddition
      };
    });
  }
}