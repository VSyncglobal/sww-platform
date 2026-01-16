// apps/api/prisma/seed.ts
import { PrismaClient, Role, AccountStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Seed...');

  // 1. Define the Super Admin
  const adminEmail = 'admin@sww.com';
  const adminPhone = '254700000000';
  const rawPassword = 'StrongPassword123!';

  // 2. Hash Password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(rawPassword, salt);

  // 3. Upsert User (Create if not exists)
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      phoneNumber: adminPhone,
      passwordHash: passwordHash,
      role: Role.SUPER_ADMIN, // <--- THE KEY AUTHORITY
      status: AccountStatus.ACTIVE,
      profile: {
        create: {
          firstName: 'System',
          lastName: 'Root',
          nationalId: '00000000',
          dateOfBirth: new Date('2000-01-01'),
          gender: 'SYSTEM',
        }
      }
    },
  });

  console.log(`✅ Super Admin created: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });