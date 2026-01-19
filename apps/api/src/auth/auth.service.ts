import { Injectable, ConflictException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto'; 

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async register(dto: RegisterDto) {
    // 1. Check Uniqueness (Email & Phone are now both on User model)
    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) throw new ConflictException('Email already in use');

    const existingPhone = await this.prisma.user.findUnique({ where: { phoneNumber: dto.phoneNumber } });
    if (existingPhone) throw new ConflictException('Phone number already in use');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    try {
      // 2. TRANSACTION: Create User + Wallet + MemberProfile
      const newUser = await this.prisma.$transaction(async (tx) => {
        return tx.user.create({
          data: {
            email: dto.email,
            phoneNumber: dto.phoneNumber, // <--- Correctly placed on User
            passwordHash: hashedPassword,
            role: 'MEMBER', 
            status: 'ACTIVE', // Matches your AccountStatus enum
            
            // Create Wallet (New schema has savings/loan/welfare balances)
            wallet: {
              create: {
                savingsBalance: 0,
                loanBalance: 0,
                welfareBalance: 0,
                lockedSavings: 0,
              },
            },
            
            // Create MemberProfile (Renamed from Profile)
            profile: {
              create: {
                firstName: dto.firstName,
                lastName: dto.lastName,
                nationalId: dto.nationalId,
                dateOfBirth: new Date(dto.dateOfBirth),
                gender: dto.gender,
              },
            },
          },
          include: { wallet: true, profile: true },
        });
      });

      return this.login(newUser);
    } catch (error) {
      console.error("Registration Error:", error);
      throw new InternalServerErrorException('Registration failed. Please try again.');
    }
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true, 
        wallet: true,
      }
    });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }
}