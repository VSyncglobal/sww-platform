import api from '@/lib/api';
import { Loan, Guarantor, CreateLoanDto } from '@/types/loans';

export const LoanService = {
  // Updated Apply to accept DTO
  apply: async (data: CreateLoanDto) => {
    return api.post('/loans/apply', data);
  },

  getMyLoans: async () => {
    const { data } = await api.get<Loan[]>('/loans');
    return data;
  },

  getIncomingRequests: async () => {
    const { data } = await api.get<Guarantor[]>('/loans/guarantors/incoming');
    return data;
  },

  checkEligibility: async () => {
    const { data } = await api.get('/loans/eligibility');
    return data;
  },
  
  acceptRequest: async (id: string) => {
    return api.patch(`/loans/guarantors/${id}/accept`);
  }
};