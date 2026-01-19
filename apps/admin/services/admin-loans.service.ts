import api from '@/lib/api';

// Expanded Types for the "Super Capable" UI
export interface AdminUser {
  id: string;
  email: string;
  profile: { firstName: string; lastName: string; nationalId: string; phone: string };
  wallet: { savingsBalance: number; loanBalance: number };
}

export interface AdminGuarantor {
  id: string;
  guarantorEmail: string;
  amountLocked: number;
  status: 'PENDING_ADMIN_CHECK' | 'PENDING_FINANCE_APPROVAL' | 'PENDING_GUARANTOR_ACTION' | 'ACCEPTED' | 'REJECTED';
  user?: AdminUser; // If linked
}

export interface LoanNote {
  id: string;
  content: string;
  role: string;
  createdAt: string;
  author: { profile: { firstName: string; lastName: string } };
}

export interface AdminLoan {
  id: string;
  principal: number;
  interest: number;
  totalDue: number;
  balance: number;
  status: string;
  appliedAt: string;
  user: AdminUser;
  guarantors: AdminGuarantor[];
  notes: LoanNote[];
  documents: any[]; // Placeholder for file logic
}

export const AdminLoanService = {
  getAllLoans: async () => {
    const { data } = await api.get<AdminLoan[]>('/loans/admin/all');
    return data;
  },

  // Governance Actions
  verify: async (id: string) => api.patch(`/loans/${id}/verify`),
  approve: async (id: string) => api.patch(`/loans/${id}/approve`),
  reject: async (id: string) => api.patch(`/loans/${id}/reject`),
  disburse: async (id: string) => api.patch(`/loans/${id}/disburse`),

  // Sub-Actions
  verifyGuarantor: async (guarantorId: string) => {
    return api.patch(`/loans/guarantors/${guarantorId}/verify`, { notes: 'Manual Admin Verification' });
  },
  
  approveGuarantorRequest: async (guarantorId: string) => {
    return api.patch(`/loans/guarantors/${guarantorId}/approve-send`);
  },

  addNote: async (loanId: string, content: string) => {
    // Assuming backend endpoint exists from previous step logic
    return api.post(`/loans/${loanId}/notes`, { content });
  }
};