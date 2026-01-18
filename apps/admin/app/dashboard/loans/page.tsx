'use client';

import { useEffect, useState } from 'react';
import { AdminLoanService, AdminLoan } from '@/services/admin-loans.service';
import { CheckCircle, XCircle, AlertCircle, Banknote, RefreshCcw } from 'lucide-react';

export default function AdminLoansPage() {
  const [loans, setLoans] = useState<AdminLoan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const data = await AdminLoanService.getAllLoans();
      setLoans(data);
    } catch (error) {
      console.error('Failed to fetch loans', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleAction = async (action: 'VERIFY' | 'APPROVE' | 'DISBURSE' | 'REJECT', id: string) => {
    if (!confirm(`Are you sure you want to ${action} this loan?`)) return;
    try {
      if (action === 'VERIFY') await AdminLoanService.verify(id);
      if (action === 'APPROVE') await AdminLoanService.approve(id);
      if (action === 'DISBURSE') await AdminLoanService.disburse(id);
      if (action === 'REJECT') await AdminLoanService.reject(id);
      alert(`Success: ${action}`);
      fetchLoans();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Action failed');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      'PENDING_VERIFICATION': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'PENDING_APPROVAL': 'bg-orange-100 text-orange-800 border-orange-200',
      'APPROVED': 'bg-blue-100 text-blue-800 border-blue-200',
      'ACTIVE': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'REJECTED': 'bg-red-100 text-red-800 border-red-200',
    };
    return (
      <span className={`px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full border ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
         <div>
            <h1 className="text-3xl font-bold text-slate-900">Loan Governance</h1>
            <p className="text-slate-500 mt-1">Verify eligibility, approve requests, and disburse funds.</p>
         </div>
         <button onClick={fetchLoans} className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
            <RefreshCcw size={16} />
            <span className="text-sm font-medium">Refresh Data</span>
         </button>
      </div>

      {loading ? (
         <div className="flex justify-center py-24">
           <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
         </div>
      ) : (
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Member Details</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Risk Ratio</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Governance Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-900">{loan.user.profile?.firstName} {loan.user.profile?.lastName}</div>
                    <div className="text-xs text-slate-500">{loan.user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-900">KES {Number(loan.principal).toLocaleString()}</div>
                    <div className="text-xs text-slate-500">Due: {Number(loan.totalDue).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900 font-medium">
                      {((Number(loan.principal) / Number(loan.user.wallet.savingsBalance)) * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-slate-400">of Savings</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(loan.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {/* FINANCE OFFICER */}
                      {loan.status === 'PENDING_VERIFICATION' && (
                        <button onClick={() => handleAction('VERIFY', loan.id)} className="flex items-center space-x-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 border border-indigo-200">
                          <CheckCircle size={14} /> <span>Verify</span>
                        </button>
                      )}
                      
                      {/* CHAIRPERSON */}
                      {loan.status === 'PENDING_APPROVAL' && (
                        <>
                          <button onClick={() => handleAction('APPROVE', loan.id)} className="flex items-center space-x-1 px-3 py-1 bg-green-50 text-green-700 rounded-md hover:bg-green-100 border border-green-200">
                            <CheckCircle size={14} /> <span>Approve</span>
                          </button>
                          <button onClick={() => handleAction('REJECT', loan.id)} className="flex items-center space-x-1 px-3 py-1 bg-red-50 text-red-700 rounded-md hover:bg-red-100 border border-red-200">
                            <XCircle size={14} /> <span>Reject</span>
                          </button>
                        </>
                      )}

                      {/* TREASURER */}
                      {loan.status === 'APPROVED' && (
                        <button onClick={() => handleAction('DISBURSE', loan.id)} className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm">
                          <Banknote size={14} /> <span>Disburse Funds</span>
                        </button>
                      )}

                      {['ACTIVE', 'COMPLETED', 'REJECTED'].includes(loan.status) && (
                         <span className="text-slate-400 italic text-xs">Archived</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loans.length === 0 && (
            <div className="p-10 text-center text-slate-500">
              No loan requests found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}