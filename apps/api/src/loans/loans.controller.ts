import { Controller, Post, Patch, Body, Param, UseGuards, Request, Get } from '@nestjs/common';
import { LoansService } from './loans.service';
import { GuarantorsService } from './guarantors.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CreateLoanDto } from './dto/create-loan.dto';

@Controller('loans')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class LoansController {
  constructor(
    private readonly loansService: LoansService,
    private readonly guarantorsService: GuarantorsService
  ) {}

  // --- LOAN ACTIONS ---

  @Get('eligibility')
  checkEligibility(@Request() req: any) {
    return this.loansService.checkEligibility(req.user.userId);
  }

  @Post('apply')
  @Roles(Role.MEMBER, Role.SUPER_ADMIN)
  apply(@Body() createLoanDto: CreateLoanDto) {
    return this.loansService.apply(createLoanDto.userId, createLoanDto.amount);
  }

  @Patch(':id/verify')
  @Roles(Role.FINANCE_OFFICER, Role.SUPER_ADMIN)
  verify(@Param('id') id: string) {
    return this.loansService.verify(id);
  }

  @Patch(':id/approve')
  @Roles(Role.CHAIRPERSON, Role.SUPER_ADMIN)
  approve(@Param('id') id: string) {
    return this.loansService.approve(id);
  }

  @Patch(':id/reject')
  @Roles(Role.CHAIRPERSON, Role.SECRETARY, Role.SUPER_ADMIN)
  reject(@Param('id') id: string) {
    return this.loansService.reject(id, 'Admin Rejected');
  }

  @Patch(':id/disburse')
  @Roles(Role.TREASURER, Role.SUPER_ADMIN)
  disburse(@Param('id') id: string) {
    return this.loansService.disburse(id);
  }

  @Post(':id/repay')
  @Roles(Role.MEMBER, Role.SUPER_ADMIN)
  repay(@Param('id') id: string, @Body() body: { amount: number }) {
    return this.loansService.repay(id, body.amount);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.loansService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.loansService.findOne(id, req.user.userId);
  }

  // --- GUARANTOR ACTIONS ---

  @Get('guarantors/incoming')
  @Roles(Role.MEMBER, Role.SUPER_ADMIN)
  getIncomingRequests(@Request() req: any) {
    return this.guarantorsService.getIncomingRequests(req.user.userId);
  }

  @Post(':id/guarantors/request')
  @Roles(Role.MEMBER, Role.SUPER_ADMIN)
  addGuarantor(@Param('id') id: string, @Body() body: { guarantorId: string, amount: number }) {
    return this.guarantorsService.requestGuarantee(id, body.guarantorId, body.amount);
  }

  @Patch('guarantors/:gid/accept')
  @Roles(Role.MEMBER, Role.SUPER_ADMIN)
  acceptGuarantee(@Param('gid') gid: string, @Request() req: any) {
    return this.guarantorsService.acceptGuarantee(gid, req.user.userId);
  }

  @Patch('guarantors/:gid/reject')
  @Roles(Role.MEMBER, Role.SUPER_ADMIN)
  rejectGuarantee(@Param('gid') gid: string, @Request() req: any) {
    return this.guarantorsService.rejectGuarantee(gid, req.user.userId);
  }
  @Get('admin/all')
  @Roles(Role.CHAIRPERSON, Role.FINANCE_OFFICER, Role.TREASURER, Role.SUPER_ADMIN)
  findAllAdmin() {
    return this.loansService.findAllAdmin();
  }
}