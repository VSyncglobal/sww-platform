import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Role, AccountStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateMemberDto } from './dto/create-member.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async findAll(status?: AccountStatus) {
    const where = status ? { status } : {};
    return this.prisma.user.findMany({
      where,
      include: { profile: true, wallet: true },
      orderBy: { createdAt: 'desc' }
    });
  }
  
  async create(createMemberDto: CreateMemberDto) {
    // 1. Check for Duplicates
    const existing = await this.prisma.user.findFirst({
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
    // Note: Using nationalId as default password based on your logic
    const passwordHash = await bcrypt.hash(createMemberDto.nationalId, salt);

    // 3. Transaction: Create User + Profile + Wallet
return await this.prisma.$transaction(async (tx) => {
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

      // Exclude password hash from result
      const { passwordHash: _, ...result } = user;
      return result;
    });
  }

  async approveMember(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' }
    });
  }

  async findAllAdmin() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        role: true,
        status: true,
        createdAt: true,
        profile: {
          select: { firstName: true, lastName: true, nationalId: true }
        },
        wallet: {
          select: { savingsBalance: true, loanBalance: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}