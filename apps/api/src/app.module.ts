import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule'; // <--- Import
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TransactionsModule } from './transactions/transactions.module';
import { MembersModule } from './members/members.module';
import { LoansModule } from './loans/loans.module';
import { GovernanceModule } from './governance/governance.module';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    ScheduleModule.forRoot(), // <--- Initialize Scheduler
    PrismaModule,
    AuthModule,
    TransactionsModule, 
    MembersModule,      
    LoansModule,        
    GovernanceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}