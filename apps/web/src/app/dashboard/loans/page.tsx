'use client';

import { useEffect, useState } from 'react';
import { LoanService } from '@/services/loans.service';
import { Loan, Guarantor, EligibilityResponse } from '@/types/loans';
import { TrendingUp, AlertCircle, Banknote, Users, Info, Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoansPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'MY_LOANS' | 'GUARANTOR'>('MY_LOANS');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [requests, setRequests] = useState<Guarantor[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Application State
  const [amount, setAmount] = useState('');
  const [guarantorEmail, setGuarantorEmail] = useState('');
  const [eligibility, setEligibility] = useState<EligibilityResponse | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [myLoans, myRequests, elig] = await Promise.all([
        LoanService.getMyLoans().catch((err) => {
            console.warn('Error fetching loans:', err);
            return [];
        }),
        LoanService.getIncomingRequests().catch((err) => {
            console.warn('Error fetching requests:', err);
            return [];
        }),
        LoanService.checkEligibility().catch(() => null)
      ]);

      setLoans(myLoans);
      setRequests(myRequests);
      setEligibility(elig);
    } catch (error) {
      console.error('Critical Dashboard Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async () => {
    if (!amount || !guarantorEmail) return alert("Please fill in Amount and Guarantor Email");
    
    // Basic validation
    if (Number(amount) <= 0) return alert("Invalid amount");
    if (eligibility && Number(amount) > eligibility.limit) return alert(`Amount exceeds limit of KES ${eligibility.limit}`);

    try {
      await LoanService.apply({ 
        amount: Number(amount), 
        duration: 1, 
        guarantorEmail 
      });
      alert('Application Submitted Successfully! The system is now verifying your guarantor.');
      setAmount('');
      setGuarantorEmail('');
      fetchData(); 
    } catch (e: any) {
      alert(e.response?.data?.message || 'Application failed');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PENDING_GUARANTORS': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'PENDING_VERIFICATION': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PENDING_APPROVAL': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. HEADER & TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a8a]">Loan Management</h1>
          <p className="text-gray-500 text-sm">Manage your borrowings and guarantee requests.</p>
        </div>
        
        <div className="bg-white p-1 rounded-xl border border-gray-200 inline-flex shadow-sm">
          <button 
            onClick={() => setActiveTab('MY_LOANS')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'MY_LOANS' ? 'bg-[#1e3a8a] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            My Loans
          </button>
          <button 
            onClick={() => setActiveTab('GUARANTOR')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'GUARANTOR' ? 'bg-[#d97706] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Requests 
            {requests.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{requests.length}</span>}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
           <Loader2 className="h-10 w-10 animate-spin text-gray-300" />
        </div>
      ) : (
        <>
          {/* TAB 1: MY LOANS */}
          {activeTab === 'MY_LOANS' && (
            <div className="grid lg:grid-cols-3 gap-6">
              
              {/* APPLY CARD */}
              <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-[#1e3a8a]">
                    <Banknote size={20} />
                  </div>
                  <h2 className="font-bold text-gray-800">Apply for Loan</h2>
                </div>
                
                {eligibility?.eligible ? (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                      <p className="text-emerald-800 text-xs font-bold uppercase tracking-wide mb-1">Available Limit</p>
                      <p className="text-2xl font-black text-emerald-700">KES {eligibility.limit.toLocaleString()}</p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Amount Required</label>
                      <div className="relative mt-2">
                        <span className="absolute left-4 top-3 text-gray-400 font-bold">KES</span>
                        <input 
                          type="number" 
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-14 pr-4 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:bg-white transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* GUARANTOR EMAIL INPUT */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Guarantor Email</label>
                      <div className="relative mt-2">
                        <input 
                          type="email" 
                          value={guarantorEmail}
                          onChange={(e) => setGuarantorEmail(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:bg-white transition-all"
                          placeholder="member@example.com"
                        />
                      </div>
                      <div className="flex gap-2 mt-2 bg-blue-50 p-3 rounded-lg">
                        <Info size={16} className="text-[#1e3a8a] flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-gray-600 leading-tight">
                            The system will perform a <span className="font-bold text-[#1e3a8a]">silent check</span> on the guarantor's liquidity before notifying them.
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={handleApply}
                      disabled={!amount || !guarantorEmail}
                      className="w-full bg-[#1e3a8a] hover:bg-blue-900 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Application
                    </button>
                    <p className="text-xs text-center text-gray-400">Interest Rate: 5% Flat • Duration: 1 Month</p>
                  </div>
                ) : (
                  <div className="bg-red-50 p-6 rounded-xl border border-red-100 text-center">
                    <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                    <h3 className="font-bold text-red-800 mb-1">Not Eligible</h3>
                    <p className="text-sm text-red-600">{eligibility?.reason || 'Criteria not met.'}</p>
                  </div>
                )}
              </div>

              {/* LOAN LIST */}
              <div className="lg:col-span-2 space-y-4">
                 {loans.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center flex flex-col items-center">
                       <TrendingUp className="w-12 h-12 text-gray-300 mb-3" />
                       <p className="text-gray-500 font-medium">No active loans found.</p>
                       <p className="text-sm text-gray-400 mt-1">Your borrowing history will appear here.</p>
                    </div>
                 ) : (
                    loans.map(loan => {
                       // Check if we are waiting for silent admin check
                       const isSilentCheck = loan.guarantors?.some(g => g.status === 'PENDING_ADMIN_CHECK');

                       return (
                           <div key={loan.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden group hover:border-[#d97706]/30 transition-all">
                              <div className="flex justify-between items-start mb-4">
                                 <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loan #{loan.id.substring(0,8).toUpperCase()}</p>
                                    <h3 className="text-2xl font-black text-gray-800 mt-1">KES {Number(loan.totalDue).toLocaleString()}</h3>
                                 </div>
                                 <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(loan.status)}`}>
                                    {loan.status.replace(/_/g, ' ')}
                                 </span>
                              </div>

                              <div className="flex gap-8 text-sm text-gray-500 mb-6">
                                 <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase">Balance</span>
                                    <span className="font-bold text-gray-700">KES {Number(loan.balance).toLocaleString()}</span>
                                 </div>
                                 <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase">Principal</span>
                                    <span className="font-bold text-gray-700">KES {Number(loan.principal).toLocaleString()}</span>
                                 </div>
                              </div>

                              {/* ACTION AREA */}
                              {isSilentCheck && (
                                 <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-center gap-3">
                                    <Loader2 size={18} className="text-purple-600 animate-spin" />
                                    <div className="text-purple-800 text-sm">
                                       <p className="font-bold">Verifying Guarantor</p>
                                       <p className="text-xs opacity-80">Admin is performing availability check...</p>
                                    </div>
                                 </div>
                              )}

                              {!isSilentCheck && loan.status === 'PENDING_GUARANTORS' && (
                                 <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-center justify-between">
                                    <div className="text-amber-800 text-sm">
                                       <p className="font-bold">Guarantor Action Required</p>
                                       <p className="text-xs opacity-80">Waiting for guarantor acceptance.</p>
                                    </div>
                                 </div>
                              )}
                           </div>
                       );
                    })
                 )}
              </div>
            </div>
          )}

          {/* TAB 2: REQUESTS */}
          {activeTab === 'GUARANTOR' && (
             <div className="space-y-4">
                {requests.length === 0 ? (
                   <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No pending guarantee requests.</p>
                   </div>
                ) : (
                   <div className="space-y-4">
                     <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <Info className="text-blue-600" size={20} />
                           <div>
                              <p className="text-blue-900 font-bold text-sm">Action Required</p>
                              <p className="text-blue-700 text-xs">Please review requests carefully. Accepting locks your funds.</p>
                           </div>
                        </div>
                        <button 
                           onClick={() => router.push('/dashboard/guarantors')}
                           className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                        >
                           Go to Action Board <ArrowRight size={16} />
                        </button>
                     </div>

                     {requests.map(req => (
                        <div key={req.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-6 opacity-75 hover:opacity-100 transition-opacity">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-lg">
                                 {req.loan.user.profile?.firstName?.[0] || 'U'}
                              </div>
                              <div>
                                 <h3 className="font-bold text-gray-900">
                                    {req.loan.user.profile?.firstName} requests support
                                 </h3>
                                 <p className="text-sm text-gray-500">
                                    Needs <span className="font-bold text-[#1e3a8a]">KES {Number(req.amountLocked).toLocaleString()}</span> guarantee
                                 </p>
                              </div>
                           </div>
                           <div className="text-right">
                              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                                 Pending Action
                              </span>
                           </div>
                        </div>
                     ))}
                   </div>
                )}
             </div>
          )}
        </>
      )}
    </div>
  );
}