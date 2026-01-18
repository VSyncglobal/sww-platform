import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, WorkflowStatus, TransactionType, TransactionStatus, PaymentProvider, Prisma } from '@prisma/client'; // <--- UPDATED IMPORTS

@Injectable()
export class GovernanceService {
  constructor(private prisma: PrismaService) {}

  // ... (Keep existing requestWithdrawal, verifyRequest, approveRequest methods) ...

  // 4. TREASURER: Disburse (The Atomic Execution)
  async disburseFunds(requestId: string, treasurerId: string) {
    // A. Verify Treasurer Identity
    const treasurer = await this.prisma.user.findUnique({ where: { id: treasurerId } });
    
    // Null check
    if (!treasurer) throw new ForbiddenException('Treasurer account not found');

    if (treasurer.role !== Role.TREASURER && treasurer.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only the Treasurer can disburse funds');
    }

    // B. Verify Request State
    const request = await this.prisma.withdrawalRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');

    if (request.status !== WorkflowStatus.APPROVED_PENDING_DISBURSEMENT) {
      throw new BadRequestException('Request is not in the APPROVED state. Cannot disburse.');
    }

    // C. ATOMIC TRANSACTION (Money Move)
    return this.prisma.$transaction(async (tx) => {
      // 1. Get Wallet & Re-Check Liquidity (Prevent Race Conditions)
      const wallet = await tx.wallet.findUnique({ where: { userId: request.userId } });
      
      if (!wallet) throw new BadRequestException('User wallet not found');
      if (Number(wallet.savingsBalance) < Number(request.amount)) {
        throw new BadRequestException('Insufficient funds. User balance has changed since approval.');
      }

      // 2. Deduct Money
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          savingsBalance: { decrement: request.amount }
        }
      });

      // 3. Create Ledger Entry (The Permanent Record)
      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount: request.amount,
          type: TransactionType.WITHDRAWAL,
          status: TransactionStatus.COMPLETED,
          provider: PaymentProvider.MPESA, // In Phase 1, we assume M-Pesa B2C
          referenceCode: `WD-${Date.now()}`, // Generated System Ref
          description: request.reason || 'Approved Withdrawal',
          metadata: {
            destination: request.destination,
            authorizedBy: request.approvedBy,
            disbursedBy: treasurerId
          }
        }
      });

      // 4. Close the Workflow Ticket
      return tx.withdrawalRequest.update({
        where: { id: requestId },
        data: {
          status: WorkflowStatus.COMPLETED,
          disbursedBy: treasurerId,
          transactionId: transaction.id
        }
      });
    });
  }

  // ... (Keep advanceWorkflow helper) ...
   // -------------------------------------------------------
  // HELPER: Workflow Engine
  // -------------------------------------------------------
  private async advanceWorkflow(
    requestId: string, 
    approverId: string, 
    requiredRole: Role, 
    currentStatus: WorkflowStatus, 
    nextStatus: WorkflowStatus
  ) {
    // A. Check Approver Role
    const approver = await this.prisma.user.findUnique({ where: { id: approverId } });
    
    // <--- FIX: Null Check Added
    if (!approver) {
      throw new ForbiddenException('Approver account not found');
    }

    if (approver.role !== requiredRole && approver.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException(`Only ${requiredRole} can perform this action`);
    }

    // B. Check Request Status
    const request = await this.prisma.withdrawalRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    
    if (request.status !== currentStatus) {
      throw new BadRequestException(`Request is not in ${currentStatus} stage`);
    }

    // C. Update Status
    const updateData: any = { status: nextStatus };
    
    // Audit Trail
    if (requiredRole === Role.FINANCE_OFFICER) updateData.verifiedBy = approverId;
    if (requiredRole === Role.CHAIRPERSON) updateData.approvedBy = approverId;

    return this.prisma.withdrawalRequest.update({
      where: { id: requestId },
      data: updateData
    });
  }

  // 1. MEMBER: Request Withdrawal
  async requestWithdrawal(userId: string, amount: number, reason: string, destination: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    
    // <--- FIX: Null Check Added
    if (!wallet) {
      throw new NotFoundException('Wallet not found. Please contact support.');
    }

    // Basic Liquidity Check
    if (Number(wallet.savingsBalance) < amount) {
      throw new BadRequestException('Insufficient savings balance');
    }

    return this.prisma.withdrawalRequest.create({
      data: {
        userId,
        amount,
        reason,
        destination,
        status: WorkflowStatus.PENDING_VERIFICATION
      }
    });
  }

  // 2. FINANCE OFFICER: Verify
  async verifyRequest(requestId: string, officerId: string) {
    return this.advanceWorkflow(requestId, officerId, Role.FINANCE_OFFICER, WorkflowStatus.PENDING_VERIFICATION, WorkflowStatus.PENDING_APPROVAL);
  }

  // 3. CHAIRPERSON: Approve
  async approveRequest(requestId: string, chairId: string) {
    return this.advanceWorkflow(requestId, chairId, Role.CHAIRPERSON, WorkflowStatus.PENDING_APPROVAL, WorkflowStatus.APPROVED_PENDING_DISBURSEMENT);
  }

}