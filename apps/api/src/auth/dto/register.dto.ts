import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  // These fields were causing the "should not exist" error
  // because they were missing or not decorated
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  // Optional fields
  @IsString()
  @IsOptional()
  nationalId?: string;

  @IsOptional()
  dateOfBirth?: string;

  @IsOptional()
  gender?: string;
}