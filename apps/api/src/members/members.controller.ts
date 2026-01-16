// apps/api/src/members/members.controller.ts
import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { AuthGuard } from '@nestjs/passport'; // The JWT Guard
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('members')
@UseGuards(AuthGuard('jwt'), RolesGuard) // Apply Security Globally to this Controller
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SECRETARY) // Only these roles can onboard
  create(@Body() createMemberDto: CreateMemberDto) {
    return this.membersService.create(createMemberDto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.SECRETARY, Role.CHAIRPERSON)
  findAll() {
    return this.membersService.findAll();
  }
}