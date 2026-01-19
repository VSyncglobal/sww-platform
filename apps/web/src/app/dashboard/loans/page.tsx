'use client';

import { useEffect, useState } from 'react';
import { LoanService } from '@/services/loans.service';
import { Loan, Guarantor, EligibilityResponse } from '@/types/loans';
import { TrendingUp, AlertCircle, Banknote, Users, Info, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
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
        LoanService.getMyLoans().catch(() => []),
        LoanService.getIncomingRequests().catch(() => []),
        LoanService.checkEligibility().catch(() => null)
      ]);
      setLoans(myLoans);
      setRequests(myRequests);
      setEligibility(elig);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApply = async () => {
    if (!amount || !guarantorEmail) return alert("Please fill in Amount and Guarantor Email");
    try {
      await LoanService.apply({ amount: Number(amount), duration: 1, guarantorEmail });
      alert('Application Submitted Successfully!');
      setAmount(''); setGuarantorEmail(''); fetchData(); 
    } catch (e: any) { alert(e.response?.data?.message || 'Application failed'); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Loan Center</h1>
          <p className="text-slate-500 font-medium mt-1">Access funds and manage your financial obligations.</p>
        </div>
        
        {/* Modern Tab Switcher */}
        <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 inline-flex">
          <button 
            onClick={() => setActiveTab('MY_LOANS')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'MY_LOANS' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Banknote size={16} /> My Loans
          </button>
          <button 
            onClick={() => setActiveTab('GUARANTOR')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'GUARANTOR' ? 'bg-[#d97706] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Users size={16} /> Requests 
            {requests.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1 animate-pulse">{requests.length}</span>}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center text-slate-400">
           <Loader2 className="h-12 w-12 animate-spin mb-4 text-blue-600" />
           <p className="font-medium">Syncing Financial Data...</p>
        </div>
      ) : (
        <>
          {activeTab === 'MY_LOANS' && (
            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* APPLICATION CARD */}
              <div className="lg:col-span-1 card-vibe p-8 h-fit">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center">
                    <Banknote size={24} />
                  </div>
                  <div>
                    <h2 className="font-bold text-xl text-slate-800">New Loan</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Eligibility Check</p>
                  </div>
                </div>
                
                {eligibility?.eligible ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 rounded-2xl text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
                      <div className="relative z-10">
                        <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">Max Limit</p>
                        <p className="text-3xl font-black">KES {eligibility.limit.toLocaleString()}</p>
                      </div>
                      <ShieldCheck className="absolute -right-4 -bottom-4 text-emerald-400/30 w-32 h-32" />
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Amount</label>
                        <input 
                          type="number" 
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full mt-1 bg-slate-50 border-0 rounded-xl py-3.5 px-4 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-300"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Guarantor Email</label>
                        <input 
                          type="email" 
                          value={guarantorEmail}
                          onChange={(e) => setGuarantorEmail(e.target.value)}
                          className="w-full mt-1 bg-slate-50 border-0 rounded-xl py-3.5 px-4 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-300"
                          placeholder="friend@sww.com"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={handleApply}
                      disabled={!amount || !guarantorEmail}
                      className="w-full bg-[#1e3a8a] hover:bg-blue-900 text-white font-bold py-4 rounded-xl shadow-xl shadow-blue-900/20 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      Process Application
                    </button>
                  </div>
                ) : (
                  <div className="bg-red-50 p-8 rounded-2xl text-center border border-red-100">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h3 className="font-bold text-red-900 mb-2">Not Eligible</h3>
                    <p className="text-sm text-red-700 leading-relaxed">{eligibility?.reason}</p>
                  </div>
                )}
              </div>

              {/* LOAN TABLE */}
              <div className="lg:col-span-2">
                 <div className="card-vibe overflow-hidden">
                   <div className="p-6 border-b border-slate-100 bg-white">
                     <h3 className="font-bold text-slate-800 text-lg">Active & Pending Loans</h3>
                   </div>
                   
                   {loans.length === 0 ? (
                      <div className="p-16 text-center">
                         <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="w-10 h-10 text-slate-300" />
                         </div>
                         <p className="text-slate-500 font-medium">No history yet. Start your journey!</p>
                      </div>
                   ) : (
                      <table className="w-full text-left">
                        <thead className="glass-header">
                          <tr>
                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Loan ID</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Amount</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Balance</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {loans.map(loan => (
                            <tr key={loan.id} className="table-row-hover group">
                              <td className="px-6 py-5">
                                <div className="font-bold text-slate-700 group-hover:text-blue-700 transition-colors">
                                  #{loan.id.substring(0,8).toUpperCase()}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                  {new Date(loan.appliedAt).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-5 text-right font-medium text-slate-600">
                                KES {Number(loan.principal).toLocaleString()}
                              </td>
                              <td className="px-6 py-5 text-right font-black text-slate-800">
                                KES {Number(loan.balance).toLocaleString()}
                              </td>
                              <td className="px-6 py-5 text-center">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border 
                                  ${loan.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                                    loan.status.includes('PENDING') ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                                    'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                  {loan.status.replace(/_/g, ' ')}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   )}
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'GUARANTOR' && (
             <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-600/20 flex justify-between items-center">
                   <div className="flex gap-4 items-center">
                      <div className="bg-white/20 p-3 rounded-xl">
                        <Info size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Guarantor Responsibility</h3>
                        <p className="text-blue-100 text-sm opacity-90">Accepting a request will temporarily lock your savings.</p>
                      </div>
                   </div>
                   <button 
                      onClick={() => router.push('/dashboard/guarantors')}
                      className="bg-white text-blue-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-50 transition shadow-lg flex items-center gap-2"
                   >
                      Manage Requests <ArrowRight size={16} />
                   </button>
                </div>
                
                {/* Simplified List Preview */}
                {requests.length > 0 && (
                  <div className="card-vibe p-6">
                    <h4 className="font-bold text-slate-800 mb-4">Pending Approvals</h4>
                    <div className="space-y-3">
                      {requests.map(req => (
                        <div key={req.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                           <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500">
                                {req.loan.user.profile?.firstName?.[0]}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm">{req.loan.user.profile?.firstName} {req.loan.user.profile?.lastName}</p>
                                <p className="text-xs text-slate-500">Request: KES {Number(req.amountLocked).toLocaleString()}</p>
                              </div>
                           </div>
                           <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg">Action Needed</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
             </div>
          )}
        </>
      )}
    </div>
  );
}