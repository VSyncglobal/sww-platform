import api from '@/lib/api';

export interface AdminLoan {
  id: string;
  principal: number;
  totalDue: number;
  balance: number;
  status: string;
  user: {
    email: string;
    phoneNumber: string;
    profile?: {
      firstName: string;
      lastName: string;
      nationalId: string;
    };
    wallet: {
      savingsBalance: number;
    }
  };
  createdAt: string;
}

export const AdminLoanService = {
  // Fetch ALL loans (with filters in future)
 getAllLoans: async () => {
    // UPDATED ENDPOINT
    const { data } = await api.get<AdminLoan[]>('/loans/admin/all'); 
    return data;
  },

  verify: async (id: string) => {
    const { data } = await api.patch(`/loans/${id}/verify`);
    return data;
  },

  approve: async (id: string) => {
    const { data } = await api.patch(`/loans/${id}/approve`);
    return data;
  },

  reject: async (id: string) => {
    const { data } = await api.patch(`/loans/${id}/reject`);
    return data;
  },

  disburse: async (id: string) => {
    const { data } = await api.patch(`/loans/${id}/disburse`);
    return data;
  }
};