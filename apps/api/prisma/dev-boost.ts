// apps/api/prisma/dev-boost.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function boostUser(email: string) {
  console.log(`🚀 Boosting User: ${email}`);

  // 1. Find the User
  const user = await prisma.user.findUnique({
    where: { email },
    include: { wallet: true }
  });

  if (!user || !user.wallet) {
    console.error('❌ User or Wallet not found!');
    return;
  }

  // 2. Time Travel (Set Join Date to 7 Months Ago)
  const sevenMonthsAgo = new Date();
  sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);

  await prisma.user.update({
    where: { id: user.id },
    data: { createdAt: sevenMonthsAgo }
  });
  console.log('✅ Tenure Updated: Member joined 7 months ago.');

  // 3. Inject Wealth (Set Savings to 15,000)
  await prisma.wallet.update({
    where: { id: user.wallet.id },
    data: { savingsBalance: 15000 }
  });
  console.log('✅ Wealth Injected: Savings set to KES 15,000.');

  console.log('🎉 Boost Complete! User is now ELIGIBLE for loans.');
}

// Run for our test user
boostUser('test.split@sww.com')
  .catch(console.error)
  .finally(() => prisma.$disconnect());