export type LoanStatus = 
  | 'PENDING_GUARANTORS' 
  | 'PENDING_VERIFICATION' 
  | 'PENDING_APPROVAL' 
  | 'APPROVED' 
  | 'ACTIVE' 
  | 'COMPLETED' 
  | 'DEFAULTED' 
  | 'REJECTED';

export type GuaranteeStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'RELEASED';

export interface Guarantor {
  id: string;
  userId: string;
  amountLocked: number;
  status: GuaranteeStatus;
  loan: {
    principal: number;
    user: {
      email: string;
      profile?: { firstName: string; lastName: string };
    };
  };
}

export interface Loan {
  id: string;
  principal: number;
  balance: number;
  totalDue: number;
  interest: number;
  status: LoanStatus;
  dueDate: string;
  createdAt: string;
  guarantors: Guarantor[];
}

export interface CreateLoanDto {
  amount: number;
  duration: number;
}