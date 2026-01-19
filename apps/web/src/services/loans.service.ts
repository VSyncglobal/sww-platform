import api from '@/lib/api';
import { Loan, Guarantor, CreateLoanDto, EligibilityResponse } from '@/types/loans';

export const LoanService = {
  checkEligibility: async () => {
    const { data } = await api.get<EligibilityResponse>('/loans/eligibility');
    return data;
  },

  apply: async (dto: CreateLoanDto) => {
    return api.post('/loans/apply', dto);
  },

  getMyLoans: async () => {
    const { data } = await api.get<Loan[]>('/loans');
    return data;
  },

  // FIX: Matches @Get('guarantors/incoming')
  getIncomingRequests: async () => {
    const { data } = await api.get<Guarantor[]>('/loans/guarantors/incoming');
    return data;
  },
  
  // FIX: Matches @Post('guarantor/:id/respond')
  respondToRequest: async (id: string, action: 'ACCEPT' | 'REJECT', signature?: string) => {
    return api.post(`/loans/guarantor/${id}/respond`, { action, signature });
  }
};