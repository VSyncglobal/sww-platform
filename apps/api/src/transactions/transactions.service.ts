import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType, PaymentProvider, TransactionStatus, Prisma } from '@prisma/client';

const WELFARE_TARGET = 4000;

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  // --- ADMIN: Manual Deposit ---
  async processManualDeposit(adminId: string, email: string, amount: number, ref: string) {
    const user = await this.prisma.user.findUnique({ where: { email }, include: { wallet: true } });
    if (!user || !user.wallet) throw new NotFoundException('User wallet not found');

    const depositAmount = Number(amount);
    
    // Use the same logic as automatic deposit
    return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        let remainingAmount = depositAmount;
        let allocatedToFines = 0;
        let allocatedToWelfare = 0;
        let allocatedToSavings = 0;

        // 1. Clear Fines
        const currentFines = Number(user.wallet!.finesBalance);
        if (currentFines > 0) {
            if (remainingAmount >= currentFines) {
                allocatedToFines = currentFines;
                remainingAmount -= currentFines;
            } else {
                allocatedToFines = remainingAmount;
                remainingAmount = 0;
            }
        }

        // 2. Welfare
        const currentWelfare = Number(user.wallet!.welfareBalance);
        if (remainingAmount > 0 && currentWelfare < WELFARE_TARGET) {
            const welfareGap = WELFARE_TARGET - currentWelfare;
            if (remainingAmount >= welfareGap) {
                allocatedToWelfare = welfareGap;
                remainingAmount -= welfareGap;
            } else {
                allocatedToWelfare = remainingAmount;
                remainingAmount = 0;
            }
        }

        // 3. Savings
        if (remainingAmount > 0) allocatedToSavings = remainingAmount;

        // Create Transaction
        await tx.transaction.create({
            data: {
                walletId: user.wallet!.id,
                amount: depositAmount,
                type: TransactionType.DEPOSIT,
                status: TransactionStatus.COMPLETED,
                provider: PaymentProvider.CASH, 
                referenceCode: ref,
                description: 'Manual Deposit by Admin',
                metadata: {
                    recordedBy: adminId,
                    split: { fines: allocatedToFines, welfare: allocatedToWelfare, savings: allocatedToSavings }
                }
            }
        });

        // Update Wallet
        await tx.wallet.update({
            where: { id: user.wallet!.id },
            data: {
                finesBalance: { decrement: allocatedToFines },
                welfareBalance: { increment: allocatedToWelfare },
                savingsBalance: { increment: allocatedToSavings }
            }
        });

        return { message: 'Deposit Recorded', breakdown: { allocatedToFines, allocatedToWelfare, allocatedToSavings } };
    });
  }

  // --- SYSTEM: M-Pesa Callback ---
  async processDeposit(userId: string, amount: number, referenceCode: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    let remainingAmount = Number(amount);
    let allocatedToFines = 0;
    let allocatedToWelfare = 0;
    let allocatedToSavings = 0;

    // 1. Clear Fines
    const currentFines = Number(wallet.finesBalance);
    if (currentFines > 0) {
      if (remainingAmount >= currentFines) {
        allocatedToFines = currentFines;
        remainingAmount -= currentFines;
      } else {
        allocatedToFines = remainingAmount;
        remainingAmount = 0;
      }
    }

    // 2. Welfare
    const currentWelfare = Number(wallet.welfareBalance);
    if (remainingAmount > 0 && currentWelfare < WELFARE_TARGET) {
      const welfareGap = WELFARE_TARGET - currentWelfare;
      if (remainingAmount >= welfareGap) {
        allocatedToWelfare = welfareGap;
        remainingAmount -= welfareGap;
      } else {
        allocatedToWelfare = remainingAmount;
        remainingAmount = 0;
      }
    }

    // 3. Savings
    if (remainingAmount > 0) allocatedToSavings = remainingAmount;

    return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount: amount,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          provider: PaymentProvider.MPESA,
          referenceCode: referenceCode,
          metadata: {
            split: { fines: allocatedToFines, welfare: allocatedToWelfare, savings: allocatedToSavings }
          }
        }
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          finesBalance: { decrement: allocatedToFines },
          welfareBalance: { increment: allocatedToWelfare },
          savingsBalance: { increment: allocatedToSavings }
        }
      });

      return { transactionId: transaction.id };
    });
  }

  async findAll(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return [];
    return this.prisma.transaction.findMany({ where: { walletId: wallet.id }, orderBy: { createdAt: 'desc' } });
  }

  async findAllAdmin() {
    return this.prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { wallet: { select: { user: { select: { email: true } } } } }
    });
  }
}