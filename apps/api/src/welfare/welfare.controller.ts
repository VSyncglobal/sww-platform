import { Controller, Post, Get, Body, UseGuards, Request, UploadedFile, UseInterceptors, Param, Patch } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WelfareService } from './welfare.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('welfare')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class WelfareController {
  constructor(private readonly welfareService: WelfareService) {}

  @Post('apply')
  @UseInterceptors(FileInterceptor('document'))
  apply(@Request() req: any, @Body() body: any, @UploadedFile() file: any) { 
    // using 'any' for file to bypass "Namespace 'global.Express' has no exported member 'Multer'"
    return this.welfareService.createClaim(req.user.userId, body, file);
  }

  @Get()
  getMyClaims(@Request() req: any) {
    return this.welfareService.findAllByUser(req.user.userId);
  }

  @Get('admin/all')
  @Roles(Role.CHAIRPERSON, Role.SECRETARY, Role.SUPER_ADMIN, Role.FINANCE_OFFICER)
  getAllClaims() {
    return this.welfareService.findAllAdmin();
  }

  @Patch(':id/review')
  @Roles(Role.CHAIRPERSON, Role.SECRETARY, Role.SUPER_ADMIN)
  review(@Param('id') id: string, @Body() body: { status: any, notes: string }) {
    return this.welfareService.reviewClaim(id, body.status, body.notes);
  }
}