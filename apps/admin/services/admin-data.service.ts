import api from '@/lib/api';

export interface AdminMember {
  id: string;
  email: string;
  phoneNumber: string;
  role: string;
  status: string;
  profile?: { firstName: string; lastName: string; nationalId: string };
  wallet?: { savingsBalance: number; loanBalance: number };
  createdAt: string;
}

export interface AdminLog {
  id: string;
  type: string;
  amount: number;
  status: string;
  referenceCode: string;
  description: string;
  createdAt: string;
  wallet: {
    user: { email: string };
  };
}

export const AdminDataService = {
  getMembers: async () => {
    const { data } = await api.get<AdminMember[]>('/members/admin/all');
    return data;
  },
  
  getLogs: async () => {
    const { data } = await api.get<AdminLog[]>('/transactions/admin/all');
    return data;
  }
};