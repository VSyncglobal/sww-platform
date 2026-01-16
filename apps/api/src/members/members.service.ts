// apps/api/src/members/members.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaClient, Role, AccountStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateMemberDto } from './dto/create-member.dto';

const prisma = new PrismaClient();

@Injectable()
export class MembersService {
  
  async create(createMemberDto: CreateMemberDto) {
    // 1. Check for Duplicates
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: createMemberDto.email },
          { phoneNumber: createMemberDto.phoneNumber }
        ]
      }
    });

    if (existing) throw new ConflictException('User with this Email or Phone already exists');

    // 2. Hash Default Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(createMemberDto.nationalId, salt);

    // 3. Transaction: Create User + Profile + Wallet
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: createMemberDto.email,
          phoneNumber: createMemberDto.phoneNumber,
          passwordHash: passwordHash,
          role: Role.MEMBER,
          status: AccountStatus.PENDING,
          profile: {
            create: {
              firstName: createMemberDto.firstName,
              lastName: createMemberDto.lastName,
              nationalId: createMemberDto.nationalId,
              dateOfBirth: new Date(createMemberDto.dateOfBirth),
              gender: createMemberDto.gender,
            }
          },
          // --- THE FINANCIAL CORE ---
          wallet: {
            create: {
              savingsBalance: 0,
              welfareBalance: 0,
              loanBalance: 0,
              finesBalance: 0,
            }
          }
          // --------------------------
        },
        include: { profile: true, wallet: true }
      });

      const { passwordHash: _, ...result } = user;
      return result;
    });
  }

  async findAll() {
    return prisma.user.findMany({
      include: { profile: true, wallet: true },
      orderBy: { createdAt: 'desc' }
    });
  }
}