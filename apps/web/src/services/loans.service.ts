import api from '@/lib/api';
import { Loan, Guarantor, CreateLoanDto, EligibilityResponse } from '@/types/loans';

export const LoanService = {
  // 1. Check if member can borrow
  checkEligibility: async () => {
    const { data } = await api.get<EligibilityResponse>('/loans/eligibility');
    return data;
  },

  // 2. Submit Application
  apply: async (dto: CreateLoanDto) => {
    return api.post('/loans/apply', dto);
  },

  // 3. Get Member's Own Loans
  getMyLoans: async () => {
    const { data } = await api.get<Loan[]>('/loans');
    return data;
  },

  // 4. Get Incoming Guarantor Requests
  getIncomingRequests: async () => {
    const { data } = await api.get<Guarantor[]>('/loans/guarantors/incoming');
    return data;
  },
  
  // 5. Action a Request (Accept)
  acceptRequest: async (id: string) => {
    return api.patch(`/loans/guarantors/${id}/accept`);
  },

  // 6. Action a Request (Reject)
  rejectRequest: async (id: string) => {
    return api.patch(`/loans/guarantors/${id}/reject`);
  }
};