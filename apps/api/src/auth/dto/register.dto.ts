import { IsEmail, IsNotEmpty, IsString, MinLength, IsDateString, IsIn } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  nationalId: string;

  // Moved to User model in new schema
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  // New Required Fields for MemberProfile
  @IsDateString()
  dateOfBirth: string; // YYYY-MM-DD

  @IsString()
  @IsIn(['MALE', 'FEMALE', 'OTHER'])
  gender: string;
}