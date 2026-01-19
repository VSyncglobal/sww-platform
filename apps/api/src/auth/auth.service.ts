import { Injectable, ConflictException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto'; 
import { LoginDto } from './dto/login.dto'; // <--- Added Import

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  // --- HELPER: Centralized Token Generation ---
  private async generateAuthResponse(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload), // <--- FIXED: camelCase to match Controller
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
      }
    };
  }

  async register(dto: RegisterDto) {
    // 1. Check Uniqueness
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
            phoneNumber: dto.phoneNumber,
            passwordHash: hashedPassword,
            role: 'MEMBER', 
            status: 'PENDING',
            
            wallet: {
              create: {
                savingsBalance: 0,
                loanBalance: 0,
                welfareBalance: 0,
                lockedSavings: 0,
              },
            },
            
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

      // <--- FIXED: Use helper instead of calling login() with Entity
      return this.generateAuthResponse(newUser);

    } catch (error) {
      console.error("Registration Error:", error);
      throw new InternalServerErrorException('Registration failed. Please try again.');
    }
  }

  // <--- FIXED: Updated to accept LoginDto and handle validation
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ 
      where: { email: dto.email },
      include: { profile: true, wallet: true } 
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return this.generateAuthResponse(user);
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
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