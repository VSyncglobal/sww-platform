// apps/api/src/members/dto/create-member.dto.ts
import { IsEmail, IsString, IsNotEmpty, IsDateString, IsEnum } from 'class-validator';

export class CreateMemberDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  nationalId: string;

  @IsDateString()
  dateOfBirth: string; // ISO Date Format YYYY-MM-DD

  @IsString()
  gender: string;
}