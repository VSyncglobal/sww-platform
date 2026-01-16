// apps/api/src/loans/loans.controller.ts
import { Controller, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { LoansService } from './loans.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { GuarantorsService } from './guarantors.service';
import { CreateLoanDto } from './dto/create-loan.dto';

@Controller('loans')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class LoansController {
    constructor(
      private readonly loansService: LoansService,
      private readonly guarantorsService: GuarantorsService // Inject
    ) {}

  // 1. APPLICATION (Maker: Member)
 @Post('apply')
  @Roles(Role.MEMBER, Role.SUPER_ADMIN)
  // REPLACE THE OLD BODY DEFINITION WITH THIS:
  apply(@Body() createLoanDto: CreateLoanDto, @Req() req: any) {
    return this.loansService.apply(createLoanDto.userId, createLoanDto.amount);
  }

  // 2. VERIFICATION (Checker 1: Finance Officer)
  @Patch(':id/verify')
  @Roles(Role.FINANCE_OFFICER, Role.SUPER_ADMIN)
  verify(@Param('id') id: string) {
    return this.loansService.verify(id);
  }

  // 3. APPROVAL (Checker 2: Chairperson)
  @Patch(':id/approve')
  @Roles(Role.CHAIRPERSON, Role.SUPER_ADMIN)
  approve(@Param('id') id: string) {
    return this.loansService.approve(id);
  }

  // 4. REJECTION (Any Admin)
  @Patch(':id/reject')
  @Roles(Role.CHAIRPERSON, Role.SECRETARY, Role.SUPER_ADMIN)
  reject(@Param('id') id: string) {
    return this.loansService.reject(id, 'Admin Rejected');
  }
  @Patch(':id/disburse')
  @Roles(Role.TREASURER, Role.SUPER_ADMIN) // Treasurer Only (Admin for testing)
  disburse(@Param('id') id: string) {
    return this.loansService.disburse(id);
  }
  // 6. REPAYMENT (Member or Admin via M-Pesa Webhook)
  @Post(':id/repay')
  @Roles(Role.MEMBER, Role.SUPER_ADMIN)
  repay(@Param('id') id: string, @Body() body: { amount: number }) {
    return this.loansService.repay(id, body.amount);
  }
  // --- GUARANTOR ENDPOINTS ---

    @Post(':id/guarantors/request')
    @Roles(Role.MEMBER, Role.SUPER_ADMIN)
    addGuarantor(@Param('id') id: string, @Body() body: { guarantorId: string, amount: number }) {
      return this.guarantorsService.requestGuarantee(id, body.guarantorId, body.amount);
    }

    @Patch('guarantors/:gid/accept')
    @Roles(Role.MEMBER, Role.SUPER_ADMIN)
    acceptGuarantee(@Param('gid') gid: string, @Body() body: { userId: string }) {
      // In prod, userId comes from @Req().user.id. For testing, we pass it in body.
      return this.guarantorsService.acceptGuarantee(gid, body.userId);
    }
}