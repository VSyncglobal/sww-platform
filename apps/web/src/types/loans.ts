export interface MemberProfile {
  firstName: string;
  lastName: string;
}

export interface User {
  email: string;
  profile: MemberProfile;
}

export interface Guarantor {
  id: string;
  amountLocked: number;
  status: 'PENDING_ADMIN_CHECK' | 'PENDING_FINANCE_APPROVAL' | 'PENDING_GUARANTOR_ACTION' | 'ACCEPTED' | 'REJECTED';
  loan: Loan; // Nested loan details for the request view
  user?: User; // The guarantor's user details (optional)
}

export interface Loan {
  id: string;
  principal: number;
  balance: number;
  totalDue: number;
  status: 'PENDING_GUARANTORS' | 'PENDING_VERIFICATION' | 'PENDING_APPROVAL' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'REJECTED' | 'DEFAULTED';
  appliedAt: string;
  guarantors?: Guarantor[]; // For checking status
  user: User; // The borrower
}

export interface CreateLoanDto {
  amount: number;
  duration: number;
  guarantorEmail: string;
}

export interface EligibilityResponse {
  eligible: boolean;
  limit: number;
  reason?: string;
}