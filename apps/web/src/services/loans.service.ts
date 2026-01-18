import api from '@/lib/api';
import { Loan, CreateLoanDto, Guarantor } from '@/types/loans';

export const LoanService = {
  // --- BORROWER ACTIONS ---
  
  checkEligibility: async () => {
    // Returns eligibility status and limits
    const { data } = await api.get<{ eligible: boolean; limit: number; savings: number; reason?: string }>('/loans/eligibility');
    return data;
  },

  apply: async (payload: CreateLoanDto) => {
    // Submits a new loan application
    const { data } = await api.post<Loan>('/loans/apply', payload);
    return data;
  },

  getMyLoans: async () => {
    // Fetches current user's loan history
    const { data } = await api.get<Loan[]>('/loans');
    return data;
  },

  repay: async (loanId: string, amount: number) => {
    // Repays a specific loan
    const { data } = await api.post(`/loans/${loanId}/repay`, { amount });
    return data;
  },

  inviteGuarantor: async (loanId: string, guarantorId: string, amount: number) => {
    // Invites another member to guarantee a loan
    const { data } = await api.post(`/loans/${loanId}/guarantors/request`, { guarantorId, amount });
    return data;
  },

  // --- GUARANTOR ACTIONS ---

  getIncomingRequests: async () => {
    // Fetches requests sent TO the current user
    const { data } = await api.get<Guarantor[]>('/loans/guarantors/incoming');
    return data;
  },

  acceptRequest: async (guaranteeId: string) => {
    // Accepts a guarantee request (Locks funds)
    const { data } = await api.patch(`/loans/guarantors/${guaranteeId}/accept`, {}); 
    return data;
  },

  rejectRequest: async (guaranteeId: string) => {
    // Rejects a guarantee request
    const { data } = await api.patch(`/loans/guarantors/${guaranteeId}/reject`, {});
    return data;
  }
};