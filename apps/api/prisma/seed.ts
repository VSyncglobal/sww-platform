import { PrismaClient, Role, AccountStatus, LoanStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Seed...');
  const password = await bcrypt.hash('password123', 10);

  // 1. MEMBER (The Borrower)
  const member = await prisma.user.upsert({
    where: { email: 'member@sww.com' },
    update: {},
    create: {
      email: 'member@sww.com',
      passwordHash: password,
      phoneNumber: '254700000001',
      role: Role.MEMBER,
      status: AccountStatus.ACTIVE,
      profile: {
        create: {
          firstName: 'John',
          lastName: 'Borrower',
          nationalId: '111111',
          dateOfBirth: new Date(),
          gender: 'MALE'
        }
      },
      wallet: {
        create: {
          savingsBalance: 50000, // Eligible for loan (50k * 0.8 = 40k limit)
        }
      }
    }
  });

  // 2. GUARANTOR (The Friend)
  const guarantor = await prisma.user.upsert({
    where: { email: 'guarantor@sww.com' },
    update: {},
    create: {
      email: 'guarantor@sww.com',
      passwordHash: password,
      phoneNumber: '254700000002',
      role: Role.MEMBER,
      status: AccountStatus.ACTIVE,
      profile: {
        create: {
          firstName: 'Jane',
          lastName: 'Guarantor',
          nationalId: '222222',
          dateOfBirth: new Date(),
          gender: 'FEMALE'
        }
      },
      wallet: {
        create: {
          savingsBalance: 100000, // Has enough to guarantee
        }
      }
    }
  });

  // 3. FINANCE OFFICER (The Verifier)
  await prisma.user.upsert({
    where: { email: 'finance@sww.com' },
    update: {},
    create: {
      email: 'finance@sww.com',
      passwordHash: password,
      phoneNumber: '254700000003',
      role: Role.FINANCE_OFFICER,
      status: AccountStatus.ACTIVE,
    }
  });

  // 4. CHAIRPERSON (The Approver)
  await prisma.user.upsert({
    where: { email: 'chair@sww.com' },
    update: {},
    create: {
      email: 'chair@sww.com',
      passwordHash: password,
      phoneNumber: '254700000004',
      role: Role.CHAIRPERSON,
      status: AccountStatus.ACTIVE,
    }
  });

  // 5. TREASURER (The Disburser)
  await prisma.user.upsert({
    where: { email: 'treasurer@sww.com' },
    update: {},
    create: {
      email: 'treasurer@sww.com',
      passwordHash: password,
      phoneNumber: '254700000005',
      role: Role.TREASURER,
      status: AccountStatus.ACTIVE,
    }
  });

  console.log('✅ Seed Complete. Default Password: "password123"');
  console.log('👉 Borrower: member@sww.com');
  console.log('👉 Guarantor: guarantor@sww.com');
  console.log('👉 Finance: finance@sww.com');
  console.log('👉 Chair: chair@sww.com');
  console.log('👉 Treasurer: treasurer@sww.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });