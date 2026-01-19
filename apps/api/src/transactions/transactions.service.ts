import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DarajaService } from '../common/daraja.service';
import { TransactionType, PaymentProvider, TransactionStatus, Prisma, ExecutionMode } from '@prisma/client';

const WELFARE_TARGET = 4000;

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly daraja: DarajaService,
  ) {}

  // --- 1. Initiate Deposit (UPDATED) ---
  async initiateDeposit(userId: string, amount: number, phoneNumber: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    // Call Daraja FIRST to get the CheckoutRequestID
    // We use a temp ref for the API call, but rely on the response ID for DB storage
    const tempRef = `REQ-${Date.now()}`; 
    let darajaResponse;

    try {
      darajaResponse = await this.daraja.initiateSTKPush(phoneNumber, amount, tempRef);
    } catch (e) {
      // If API call fails, don't create a transaction
      throw e;
    }

    // Capture the unique Daraja Track Code
    const checkoutRequestID = darajaResponse.CheckoutRequestID;

    // Create PENDING Transaction
    // We use CheckoutRequestID as the referenceCode initially so we can find it in the callback
    await this.prisma.transaction.create({
      data: {
        walletId: wallet.id,
        amount: amount,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.PENDING,
        provider: PaymentProvider.MPESA,
        executionMode: ExecutionMode.AUTOMATIC,
        referenceCode: checkoutRequestID, // <--- CRITICAL: Store this for lookup
        description: 'M-Pesa STK Push Initiated',
        metadata: {
            merchantRequestId: darajaResponse.MerchantRequestID,
            tempRef: tempRef
        }
      }
    });

    return { 
        message: 'STK Push Sent. Check your phone.', 
        reference: checkoutRequestID 
    };
  }

  // --- 2. Handle Callback (UPDATED & ADAPTIVE) ---
  async processMpesaCallback(payload: any) {
    const body = payload.Body.stkCallback;
    const checkoutRequestID = body.CheckoutRequestID;
    const resultCode = body.ResultCode; // 0 = Success, Others = Fail

    this.logger.log(`Processing Callback for TrackCode: ${checkoutRequestID} | Result: ${resultCode}`);

    // Find Transaction by the Track Code
    const transaction = await this.prisma.transaction.findUnique({
      where: { referenceCode: checkoutRequestID }, // We stored this in initiateDeposit
      include: { wallet: true }
    });

    if (!transaction) {
      // If we can't find it by strict reference, check if it was already processed 
      // (Reference might have changed to MPESA-...)
      this.logger.warn(`Transaction not found (or already processed) for ID: ${checkoutRequestID}`);
      return;
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      this.logger.log(`Transaction ${transaction.id} already final.`);
      return;
    }

    // --- CASE A: FAILURE ---
    if (resultCode !== 0) {
      this.logger.warn(`Payment Failed: ${body.ResultDesc}`);
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.FAILED,
          description: `Failed: ${body.ResultDesc}`
        }
      });
      return;
    }

    // --- CASE B: SUCCESS (Adaptive) ---
    // Extract metadata
    const meta = body.CallbackMetadata.Item;
    const amount = Number(meta.find((i: any) => i.Name === 'Amount')?.Value);
    const receipt = meta.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value;
    // const phone = meta.find((i: any) => i.Name === 'PhoneNumber')?.Value;

    // Construct Requested Reference Format: MPESA-{Receipt}-{TrackCode}
    const finalReference = `MPESA-${receipt}-${checkoutRequestID}`;

    // Calculate Split
    const { allocatedToFines, allocatedToWelfare, allocatedToSavings } = this.calculateSplit(
        transaction.wallet, 
        amount
    );

    // Update DB
    await this.prisma.$transaction([
      // 1. Update Transaction (Status + Final Reference)
      this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.COMPLETED,
          amount: amount, // Ensure we record actual amount paid
          referenceCode: finalReference, // <--- UPDATE TO FINAL FORMAT
          description: 'Deposit Completed via M-Pesa',
          metadata: {
             mpesaReceipt: receipt,
             darajaTrackCode: checkoutRequestID,
             originalPayload: body,
             split: { fines: allocatedToFines, welfare: allocatedToWelfare, savings: allocatedToSavings }
          }
        }
      }),
      // 2. Update Wallet Balances
      this.prisma.wallet.update({
        where: { id: transaction.wallet.id },
        data: {
          finesBalance: { decrement: allocatedToFines },
          welfareBalance: { increment: allocatedToWelfare },
          savingsBalance: { increment: allocatedToSavings }
        }
      })
    ]);

    this.logger.log(`Deposit Finalized: ${finalReference}`);
  }

  // --- Helper: Split Logic ---
  private calculateSplit(wallet: any, amount: number) {
    let remaining = amount;
    let allocatedToFines = 0;
    let allocatedToWelfare = 0;
    let allocatedToSavings = 0;

    // 1. Fines
    const currentFines = Number(wallet.finesBalance);
    if (currentFines > 0) {
        if (remaining >= currentFines) {
            allocatedToFines = currentFines;
            remaining -= currentFines;
        } else {
            allocatedToFines = remaining;
            remaining = 0;
        }
    }

    // 2. Welfare
    const currentWelfare = Number(wallet.welfareBalance);
    if (remaining > 0 && currentWelfare < WELFARE_TARGET) {
        const welfareGap = WELFARE_TARGET - currentWelfare;
        if (remaining >= welfareGap) {
            allocatedToWelfare = welfareGap;
            remaining -= welfareGap;
        } else {
            allocatedToWelfare = remaining;
            remaining = 0;
        }
    }

    // 3. Savings
    if (remaining > 0) allocatedToSavings = remaining;

    return { allocatedToFines, allocatedToWelfare, allocatedToSavings };
  }

  // --- Read Methods ---
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

    // --- Keep Manual Deposit for Admin ---
  async processManualDeposit(adminId: string, email: string, amount: number, ref: string) {
     // ... (Keep existing manual deposit logic if needed, or I can paste it if you want strict file replacement)
     // For brevity, assuming you keep the previous logic here or I can reprint it.
     // REPRINTING FULL MANUAL LOGIC FOR SAFETY:
    const user = await this.prisma.user.findUnique({ where: { email }, include: { wallet: true } });
    if (!user || !user.wallet) throw new NotFoundException('User wallet not found');
    const depositAmount = Number(amount);
    return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const { allocatedToFines, allocatedToWelfare, allocatedToSavings } = this.calculateSplit(user.wallet, depositAmount);
        await tx.transaction.create({
            data: {
                walletId: user.wallet!.id,
                amount: depositAmount,
                type: TransactionType.DEPOSIT,
                status: TransactionStatus.COMPLETED,
                provider: PaymentProvider.CASH, 
                referenceCode: ref,
                description: 'Manual Deposit by Admin',
                metadata: { recordedBy: adminId, split: { fines: allocatedToFines, welfare: allocatedToWelfare, savings: allocatedToSavings } }
            }
        });
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
}