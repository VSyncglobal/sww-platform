import { Controller, Post, Patch, Body, Param, UseGuards, Request, Get, BadRequestException } from '@nestjs/common';
import { LoansService } from './loans.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('loans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoansController {
  constructor(
    private readonly loansService: LoansService,
  ) {}

  // ==================================================================
  // 1. MEMBER ENDPOINTS
  // ==================================================================

  @Get('eligibility')
  checkEligibility(@Request() req: any) {
    return this.loansService.checkEligibility(req.user.userId);
  }

  @Post('apply')
  @Roles(Role.MEMBER, Role.SUPER_ADMIN)
  apply(@Request() req: any, @Body() body: { amount: number, guarantorEmail: string }) {
    return this.loansService.apply(req.user.userId, body.amount, body.guarantorEmail);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.loansService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.loansService.findOne(id, req.user.userId);
  }

  @Post(':id/repay')
  @Roles(Role.MEMBER, Role.SUPER_ADMIN)
  repay(@Param('id') id: string, @Body() body: { amount: number }) {
    return this.loansService.repay(id, body.amount);
  }

  // ==================================================================
  // 2. GUARANTOR ENDPOINTS
  // ==================================================================

  // FIX: This route matches the frontend call api.get('/loans/guarantors/incoming')
  @Get('guarantors/incoming')
  @Roles(Role.MEMBER, Role.SUPER_ADMIN)
  getIncomingRequests(@Request() req: any) {
    return this.loansService.getMyGuarantorRequests(req.user.userId);
  }

  // FIX: Added the POST route to handle the digital signature logic
  @Post('guarantor/:id/respond')
  @Roles(Role.MEMBER, Role.SUPER_ADMIN)
  respondToGuarantorRequest(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { action: 'ACCEPT' | 'REJECT'; signature?: string }
  ) {
    if (!body.action) throw new BadRequestException('Action is required');
    
    return this.loansService.respondToGuarantorRequest(
      id, 
      req.user.userId, 
      body.action, 
      body.signature
    );
  }

  // ==================================================================
  // 3. ADMIN / GOVERNANCE WORKFLOW
  // ==================================================================

  @Get('admin/all')
  @Roles(Role.CHAIRPERSON, Role.FINANCE_OFFICER, Role.TREASURER, Role.SUPER_ADMIN)
  findAllAdmin() {
    return this.loansService.findAllAdmin();
  }

  @Patch('guarantors/:id/verify')
  @Roles(Role.FINANCE_OFFICER, Role.SUPER_ADMIN, Role.CHAIRPERSON)
  verifyGuarantor(@Param('id') id: string, @Body() body: { notes: string }) {
    return this.loansService.verifyGuarantor(id, body.notes);
  }

  @Patch('guarantors/:id/approve-send')
  @Roles(Role.FINANCE_OFFICER, Role.SUPER_ADMIN)
  approveSend(@Param('id') id: string) {
    return this.loansService.approveGuarantorRequest(id);
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
}