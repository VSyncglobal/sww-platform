import { Module } from '@nestjs/common';
import { WelfareService } from './welfare.service';
import { WelfareController } from './welfare.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WelfareController],
  providers: [WelfareService],
})
export class WelfareModule {}