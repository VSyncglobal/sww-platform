import { Injectable, BadRequestException, ConflictException, NotFoundException, Logger, ForbiddenException } from '@nestjs/common'; // <--- FIXED: Added ForbiddenException
import { PrismaService } from '../prisma/prisma.service';
import { LoanStatus, TransactionType, TransactionStatus, PaymentProvider, GuarantorStatus } from '@prisma/client';

@Injectable()
export class LoansService {
  private readonly logger = new Logger(LoansService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================================================================
  // 1. CORE LENDING LOGIC (Apply, Verify, Approve, Disburse, Repay)
  // ==================================================================

  // 1.1 APPLY (Member)
  async apply(userId: string, amount: number, guarantorEmail: string) {
    const amountDec = Number(amount);

    // Fetch Context
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true, loans: true }
    });

    if (!user || !user.wallet) throw new BadRequestException('User profile incomplete');

    // Rule: Cannot guarantee self
    if (user.email === guarantorEmail) {
        throw new BadRequestException("You cannot guarantee your own loan.");
    }

    // Rule: Active Loan Check
    const activeLoan = user.loans.find(l => 
      ['PENDING_GUARANTORS', 'PENDING_VERIFICATION', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE'].includes(l.status)
    );
    if (activeLoan) throw new ConflictException('You already have an active or pending loan.');

    // Rule: Tenure (> 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    if (user.createdAt > sixMonthsAgo) {
        throw new BadRequestException('Membership tenure must be > 6 months.');
    }

    // Rule: Savings Threshold
    const totalSavings = Number(user.wallet.savingsBalance);
    if (totalSavings < 10000) {
        throw new BadRequestException(`Minimum savings of KES 10,000 required. Current: ${totalSavings}`);
    }

    // Rule: Limit Calculation (80%)
    const maxLoan = totalSavings * 0.80;
    if (amountDec > maxLoan) {
        throw new BadRequestException(`Loan exceeds limit. Max allowed: ${maxLoan}`);
    }

    // Financials
    const interest = amountDec * 0.05; // 5% Flat
    const totalDue = amountDec + interest;

    // Create
    return await this.prisma.loan.create({
      data: {
        userId: user.id,
        principal: amountDec,
        interest: interest,
        totalDue: totalDue,
        balance: totalDue,
        status: 'PENDING_GUARANTORS',
        guarantors: {
          create: {
            guarantorEmail, 
            amountLocked: amountDec, 
            status: 'PENDING_ADMIN_CHECK', // Silent Check
          },
        },
      },
    });
  }

  // 1.2 VERIFY (Finance Officer)
  async verify(loanId: string) {
    const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');
    
    return await this.prisma.loan.update({
      where: { id: loanId },
      data: { status: LoanStatus.PENDING_APPROVAL }
    });
  }

  // 1.3 APPROVE (Chairperson)
  async approve(loanId: string) {
    return await this.prisma.loan.update({
      where: { id: loanId },
      data: { status: LoanStatus.APPROVED }
    });
  }

  // 1.4 REJECT (Admin)
  async reject(loanId: string, reason: string) {
    return await this.prisma.loan.update({
      where: { id: loanId },
      data: { status: LoanStatus.REJECTED, adminNotes: reason }
    });
  }

  // 1.5 DISBURSE (Treasurer)
  async disburse(loanId: string) {
    const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');

    if (loan.status !== 'APPROVED') {
      throw new BadRequestException('Loan is not approved for disbursement');
    }

    const now = new Date();
    const dueDate = new Date();
    dueDate.setDate(now.getDate() + 30); // 30 Day Term

    return await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: loan.userId } });
      if (!wallet) throw new NotFoundException('User wallet not found.');

      // Activate Loan
      const activeLoan = await tx.loan.update({
        where: { id: loanId },
        data: { 
          status: LoanStatus.ACTIVE, 
          disbursedAt: now,
          dueDate: dueDate
        }
      });

      // Update Wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { loanBalance: { increment: loan.totalDue } }
      });

      // Transaction Record
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

  // 1.6 REPAY (Member)
  async repay(loanId: string, amount: number) {
    const payment = Number(amount);
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { user: { include: { wallet: true } }, guarantors: true }
    });

    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status !== 'ACTIVE' && loan.status !== 'DEFAULTED') throw new BadRequestException('Loan not active');

    // FIX: Null Check for User/Wallet
    if (!loan.user || !loan.user.wallet) throw new NotFoundException('Wallet not found');
    const wallet = loan.user.wallet;
    
    // Split Payment Logic
    const currentBalance = Number(loan.balance);
    let loanDeduction = 0;
    let savingsAddition = 0;

    if (payment >= currentBalance) {
      loanDeduction = currentBalance;
      savingsAddition = payment - currentBalance;
    } else {
      loanDeduction = payment;
    }

    return await this.prisma.$transaction(async (tx) => {
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          balance: { decrement: loanDeduction },
          status: (loanDeduction >= currentBalance) ? LoanStatus.COMPLETED : loan.status
        }
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          loanBalance: { decrement: loanDeduction },
          savingsBalance: { increment: savingsAddition }
        }
      });
      
      // Release Guarantors if loan is cleared
      if (updatedLoan.status === LoanStatus.COMPLETED) {
        for (const g of loan.guarantors) {
          if (g.status === 'ACCEPTED') {
             if (g.userId) { // Check if guarantor has a user ID
                await tx.wallet.update({
                    where: { userId: g.userId },
                    data: { lockedSavings: { decrement: g.amountLocked } }
                });
             }
             
             // Using 'as any' as a safeguard if enum not updated in client yet, otherwise use GuarantorStatus.RELEASED
             await tx.guarantor.update({
               where: { id: g.id },
               data: { status: 'RELEASED' as any } 
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

  // ==================================================================
  // 2. GUARANTOR WORKFLOW (Silent Check & Approval)
  // ==================================================================

  // 2.1 ADMIN: SILENT CHECK
  async verifyGuarantor(guarantorId: string, adminNotes: string) {
    const request = await this.prisma.guarantor.findUnique({ where: { id: guarantorId } });
    if (!request) throw new NotFoundException('Guarantor request not found');

    const potentialGuarantor = await this.prisma.user.findUnique({ 
        where: { email: request.guarantorEmail },
        include: { wallet: true }
    });

    if (!potentialGuarantor) {
       await this.prisma.guarantor.update({ where: { id: guarantorId }, data: { status: 'REJECTED' }});
       throw new BadRequestException('Guarantor email does not exist in the system.');
    }

    const savings = Number(potentialGuarantor.wallet?.savingsBalance || 0);
    const locked = Number(potentialGuarantor.wallet?.lockedSavings || 0);
    const required = Number(request.amountLocked);

    if ((savings - locked) < required) {
        throw new BadRequestException(`Insufficient free savings. Available: ${savings - locked}`);
    }

    await this.prisma.loan.update({
        where: { id: request.loanId },
        data: { adminNotes: `Guarantor Verified: ${adminNotes}` }
    });

    return this.prisma.guarantor.update({
        where: { id: guarantorId },
        data: { 
            userId: potentialGuarantor.id, 
            status: 'PENDING_FINANCE_APPROVAL' 
        }
    });
  }

  // 2.2 FINANCE: APPROVE SENDING
  async approveGuarantorRequest(guarantorId: string) {
    return this.prisma.guarantor.update({
        where: { id: guarantorId },
        data: { status: 'PENDING_GUARANTOR_ACTION' } 
    });
  }

  // ==================================================================
  // 3. AUTOMATION & COMPLIANCE (For Scheduler)
  // ==================================================================

  // 3.1 FIND OVERDUE
  async getOverdueLoans() {
    const now = new Date();
    return this.prisma.loan.findMany({
      where: {
        status: LoanStatus.ACTIVE,
        dueDate: { lt: now }
      }
    });
  }

  // 3.2 APPLY PENALTY
  async applyOverduePenalty(loanId: string) {
    return this.prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({ where: { id: loanId } });
      if (!loan) return;

      const penaltyAmount = Number(loan.balance) * 0.10; 
      
      await tx.loan.update({
        where: { id: loanId },
        data: {
          balance: { increment: penaltyAmount },
          totalDue: { increment: penaltyAmount },
        }
      });

      const wallet = await tx.wallet.findUnique({ where: { userId: loan.userId } });
      if (wallet) {
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
      }
    });
  }

  // 3.3 MARK DEFAULT
  async markLoanAsDefault(loanId: string) {
    return this.prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({ where: { id: loanId } });
      if (!loan) return;

      await tx.loan.update({
        where: { id: loanId },
        data: { status: LoanStatus.DEFAULTED }
      });

      // Ensure 'DEFAULTED' exists in your AccountStatus Enum, otherwise use SUSPENDED
      await tx.user.update({
        where: { id: loan.userId },
        data: { status: 'DEFAULTED' as any } 
      });

      this.logger.warn(`Loan ${loanId} defaulted. User blocked.`);
    });
  }

  // ==================================================================
  // 4. HELPERS
  // ==================================================================
  
  async checkEligibility(userId: string) {
     const user = await this.prisma.user.findUnique({
       where: { id: userId },
       include: { wallet: true }
     });
     
     if(!user || !user.wallet) return { eligible: false, reason: 'Profile incomplete' };
     
     const savings = Number(user.wallet.savingsBalance);
     if (savings < 10000) return { eligible: false, reason: 'Minimum KES 10,000 savings required' };

     return { eligible: true, limit: savings * 0.80, savings };
  }

  async findAll(userId: string) {
    return this.prisma.loan.findMany({ where: { userId }, include: { guarantors: true } });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.loan.findFirst({ where: { id, userId }, include: { guarantors: true } });
  }

  async findAllAdmin() {
    return this.prisma.loan.findMany({
      orderBy: { appliedAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, phoneNumber: true, profile: true, wallet: true } },
        guarantors: true
      }
    });
  }

  async addNote(loanId: string, authorId: string, content: string) {
    const author = await this.prisma.user.findUnique({ where: { id: authorId } });
    if (!author) throw new NotFoundException('Author not found');

    return this.prisma.loanNote.create({
      data: {
        loanId,
        authorId,
        content,
        role: author.role,
      },
      include: { author: { include: { profile: true } } }
    });
  }

  // --- NEW: Guarantor Digital Signature Action ---
  async respondToGuarantorRequest(
    guarantorId: string, 
    userId: string, 
    action: 'ACCEPT' | 'REJECT', 
    signature?: string
  ) {
    const request = await this.prisma.guarantor.findUnique({
      where: { id: guarantorId },
      include: { user: { include: { profile: true } }, loan: true }
    });

    if (!request) throw new NotFoundException('Guarantor request not found');
    
    // FIX: Using ForbiddenException here
    if (request.userId !== userId) throw new ForbiddenException('Not authorized for this request');
    
    if (request.status !== GuarantorStatus.PENDING_GUARANTOR_ACTION) {
      throw new BadRequestException('Request is not pending action');
    }

    if (action === 'ACCEPT') {
      // 1. Digital Signature Check (First Name Match - Case Insensitive)
      const firstName = request.user?.profile?.firstName?.toLowerCase();
      const signedName = signature?.trim().toLowerCase();

      if (!firstName || !signedName || firstName !== signedName) {
        throw new BadRequestException(`Digital Signature Failed. Please type "${request.user?.profile?.firstName}" exactly.`);
      }

      // 2. Lock Funds
      await this.prisma.$transaction([
        this.prisma.wallet.update({
          where: { userId },
          data: { lockedSavings: { increment: request.amountLocked } }
        }),
        this.prisma.guarantor.update({
          where: { id: guarantorId },
          data: { status: GuarantorStatus.ACCEPTED }
        })
      ]);

      return { message: 'Guarantorship Accepted & Funds Locked' };
    } else {
      await this.prisma.guarantor.update({
        where: { id: guarantorId },
        data: { status: GuarantorStatus.REJECTED }
      });
      return { message: 'Guarantorship Rejected' };
    }
  }

  async getMyGuarantorRequests(userId: string) {
    return this.prisma.guarantor.findMany({
      where: { userId },
      include: { 
        loan: { 
          include: { 
            user: { include: { profile: true } } 
          } 
        } 
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}