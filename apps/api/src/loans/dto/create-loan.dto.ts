// apps/api/src/loans/dto/create-loan.dto.ts
import { IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLoanDto {
  @ApiProperty({ 
    example: 'user-uuid-here', 
    description: 'The ID of the member applying for the loan' 
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ 
    example: 10000, 
    description: 'Amount requested in KES' 
  })
  @IsNumber()
  @Min(500)
  amount: number;
}