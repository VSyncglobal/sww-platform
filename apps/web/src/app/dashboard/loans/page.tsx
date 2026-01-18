'use client';

import { useEffect, useState } from 'react';
import { LoanService } from '@/services/loans.service';
import { Loan, Guarantor } from '@/types/loans';

export default function LoansPage() {
  const [activeTab, setActiveTab] = useState<'MY_LOANS' | 'GUARANTOR'>('MY_LOANS');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [requests, setRequests] = useState<Guarantor[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Application Form State
  const [amount, setAmount] = useState('');
  const [eligibility, setEligibility] = useState<{ eligible: boolean; limit: number; reason?: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [myLoans, myRequests, elig] = await Promise.all([
        LoanService.getMyLoans(),
        LoanService.getIncomingRequests(),
        LoanService.checkEligibility()
      ]);
      setLoans(myLoans);
      setRequests(myRequests);
      setEligibility(elig);
    } catch (error) {
      console.error('Failed to load loan data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async () => {
    if (!amount) return;
    try {
      await LoanService.apply({ amount: Number(amount), duration: 1 });
      alert('Loan Application Submitted!');
      setAmount('');
      fetchData(); // Refresh list
    } catch (e: any) {
      alert(e.response?.data?.message || 'Application failed');
    }
  };

  const handleAcceptGuarantee = async (id: string) => {
    if(!confirm("Are you sure? This will LOCK your savings until the loan is paid.")) return;
    try {
      await LoanService.acceptRequest(id);
      alert('Guarantee Accepted. Funds Locked.');
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Loan Management</h1>

      {/* TABS NAVIGATION */}
      <div className="flex space-x-4 border-b">
        <button 
          onClick={() => setActiveTab('MY_LOANS')}
          className={`pb-2 px-4 ${activeTab === 'MY_LOANS' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
        >
          My Loans
        </button>
        <button 
          onClick={() => setActiveTab('GUARANTOR')}
          className={`pb-2 px-4 ${activeTab === 'GUARANTOR' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Guarantor Requests 
          {requests.length > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{requests.length}</span>}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading Financial Data...</div>
      ) : (
        <>
          {/* TAB 1: MY LOANS & APPLICATION */}
          {activeTab === 'MY_LOANS' && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* LEFT: Application Form */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold mb-4">Apply for Loan</h2>
                
                {eligibility?.eligible ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 p-3 rounded text-green-700 text-sm border border-green-200">
                      ✅ You are eligible for up to <strong>KES {eligibility.limit.toLocaleString()}</strong>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount (KES)</label>
                      <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Ex: 5000"
                      />
                    </div>
                    <button 
                      onClick={handleApply}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                    >
                      Submit Application
                    </button>
                    <p className="text-xs text-gray-500">Interest: 5% flat per month.</p>
                  </div>
                ) : (
                  <div className="bg-red-50 p-4 rounded text-red-700 border border-red-200">
                    ❌ <strong>Not Eligible:</strong> {eligibility?.reason || 'Criteria not met'}
                  </div>
                )}
              </div>

              {/* RIGHT: Active Loans List */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Active Applications</h2>
                {loans.length === 0 && <p className="text-gray-500 italic">No active loans found.</p>}
                
                {loans.map((loan) => (
                  <div key={loan.id} className="bg-white p-4 rounded-lg shadow-sm border relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Loan #{loan.id.substring(0,8)}</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">KES {Number(loan.totalDue).toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-1">Balance: KES {Number(loan.balance).toLocaleString()}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                        ${loan.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                          loan.status === 'PENDING_GUARANTORS' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                        {loan.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {loan.status === 'PENDING_GUARANTORS' && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-gray-600 mb-2">
                          <strong>Action Required:</strong> Invite Guarantors to cover KES {Number(loan.principal).toLocaleString()}
                        </p>
                        <div className="flex gap-2">
                           <button className="text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 px-3 py-1.5 rounded transition-colors">
                             + Invite Member ID
                           </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: GUARANTOR REQUESTS */}
          {activeTab === 'GUARANTOR' && (
            <div className="space-y-4">
              {requests.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-gray-50 rounded border border-dashed">
                  No pending guarantee requests found.
                </div>
              ) : (
                requests.map((req) => (
                  <div key={req.id} className="bg-white p-6 rounded-lg shadow-sm border flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {req.loan.user.profile?.firstName || 'Member'} requests your guarantee
                      </h3>
                      <div className="mt-1">
                        <p className="text-gray-600">
                          Lock Amount: <span className="font-bold text-gray-900">KES {Number(req.amountLocked).toLocaleString()}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Request ID: {req.id.substring(0,8)} • {req.loan.user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => LoanService.rejectRequest(req.id)}
                        className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
                      >
                        Decline
                      </button>
                      <button 
                        onClick={() => handleAcceptGuarantee(req.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm transition-colors"
                      >
                        Accept & Lock Funds
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}