'use client';

import { useEffect, useState, useMemo } from 'react';
import { AdminLoanService, AdminLoan } from '@/services/admin-loans.service';
import { 
  CheckCircle, XCircle, AlertCircle, Banknote, RefreshCcw, 
  Search, Filter, ChevronRight, User, Shield, FileText, 
  MessageSquare, Paperclip, Send, X, Lock
} from 'lucide-react';

export default function AdminLoansPage() {
  const [loans, setLoans] = useState<AdminLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<AdminLoan | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Drawer Actions
  const [noteInput, setNoteInput] = useState('');

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const data = await AdminLoanService.getAllLoans();
      setLoans(data);
      // Update selected loan if open to keep data fresh
      if (selectedLoan) {
        const updated = data.find(l => l.id === selectedLoan.id);
        if (updated) setSelectedLoan(updated);
      }
    } catch (error) {
      console.error('Failed to fetch loans', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLoans(); }, []);

  // Filter Logic
  const filteredLoans = useMemo(() => {
    return loans.filter(loan => {
      const matchesSearch = 
        loan.user.profile.firstName.toLowerCase().includes(search.toLowerCase()) ||
        loan.user.email.toLowerCase().includes(search.toLowerCase()) ||
        loan.id.includes(search);
      
      const matchesStatus = statusFilter === 'ALL' || loan.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [loans, search, statusFilter]);

  // Action Handlers
  const handleLoanAction = async (action: 'VERIFY' | 'APPROVE' | 'DISBURSE' | 'REJECT', id: string) => {
    if (!confirm(`Confirm ${action} action?`)) return;
    try {
      if (action === 'VERIFY') await AdminLoanService.verify(id);
      if (action === 'APPROVE') await AdminLoanService.approve(id);
      if (action === 'DISBURSE') await AdminLoanService.disburse(id);
      if (action === 'REJECT') await AdminLoanService.reject(id);
      fetchLoans();
    } catch (e: any) { alert(e.response?.data?.message || 'Action failed'); }
  };

  const handleGuarantorVerify = async (gid: string) => {
    try { await AdminLoanService.verifyGuarantor(gid); fetchLoans(); } 
    catch (e) { alert('Verification Failed'); }
  };

  const handlePostNote = async () => {
    if (!selectedLoan || !noteInput.trim()) return;
    try {
      await AdminLoanService.addNote(selectedLoan.id, noteInput);
      setNoteInput('');
      fetchLoans();
    } catch (e) { alert('Failed to post note'); }
  };

  // UI Helpers
  const getStatusBadge = (status: string) => {
    const styles: any = {
      'PENDING_VERIFICATION': 'bg-purple-100 text-purple-700 border-purple-200',
      'PENDING_APPROVAL': 'bg-amber-100 text-amber-700 border-amber-200',
      'APPROVED': 'bg-blue-100 text-blue-700 border-blue-200',
      'ACTIVE': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'REJECTED': 'bg-red-100 text-red-700 border-red-200',
      'DEFAULTED': 'bg-gray-800 text-white border-gray-900',
    };
    return (
      <span className={`px-2.5 py-0.5 inline-flex items-center text-[10px] font-bold uppercase tracking-wider rounded-full border ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col space-y-4 animate-in fade-in duration-500 relative">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
         <div>
            <h1 className="text-2xl font-bold text-slate-900">Loan Governance</h1>
            <p className="text-slate-500 text-sm">Manage {loans.length} active applications.</p>
         </div>
         
         <div className="flex flex-1 w-full md:w-auto gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search member or ID..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select 
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 focus:outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING_VERIFICATION">Verification</option>
              <option value="PENDING_APPROVAL">Approval</option>
              <option value="ACTIVE">Active</option>
            </select>
            <button onClick={fetchLoans} className="p-2 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50">
               <RefreshCcw size={18} />
            </button>
         </div>
      </div>

      {/* DATA GRID */}
      <div className="flex-1 overflow-hidden bg-white shadow-sm border border-slate-200 rounded-xl flex flex-col">
        {loading ? (
           <div className="flex-1 flex justify-center items-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
           </div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Applicant</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Financials</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Guarantors</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredLoans.map((loan) => (
                  <tr 
                    key={loan.id} 
                    onClick={() => setSelectedLoan(loan)}
                    className={`cursor-pointer transition-colors ${selectedLoan?.id === loan.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                          {loan.user.profile.firstName[0]}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{loan.user.profile.firstName} {loan.user.profile.lastName}</div>
                          <div className="text-xs text-slate-500 font-mono">{loan.id.substring(0,6)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900">KES {Number(loan.principal).toLocaleString()}</div>
                      <div className="flex items-center gap-1 mt-1">
                         <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500" 
                              style={{ width: `${Math.min((Number(loan.user.wallet.savingsBalance) / Number(loan.principal)) * 100, 100)}%` }}
                            />
                         </div>
                         <span className="text-[10px] text-slate-400">Savings Cover</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex -space-x-2">
                        {loan.guarantors.map((g, i) => (
                           <div key={g.id} className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white
                             ${g.status === 'ACCEPTED' ? 'bg-green-500' : 'bg-amber-400'}`} title={g.status}>
                             {i + 1}
                           </div>
                        ))}
                        {loan.guarantors.length === 0 && <span className="text-xs text-slate-400 italic">None</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(loan.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight className="inline-block text-slate-400" size={18} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SLIDE-OVER DETAILS PANEL */}
      {selectedLoan && (
        <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl border-l border-slate-200 transform transition-transform duration-300 z-50 flex flex-col">
          
          {/* Panel Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
             <div>
               <h2 className="text-xl font-bold text-slate-900">Loan Details</h2>
               <p className="text-sm text-slate-500 font-mono">ID: {selectedLoan.id}</p>
             </div>
             <button onClick={() => setSelectedLoan(null)} className="text-slate-400 hover:text-slate-600">
               <X size={24} />
             </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* 1. STATUS & ACTIONS (Top Priority) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
               <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase">Governance Status</span>
                  {getStatusBadge(selectedLoan.status)}
               </div>
               
               <div className="grid grid-cols-2 gap-3">
                  {selectedLoan.status === 'PENDING_VERIFICATION' && (
                     <button 
                       onClick={() => handleLoanAction('VERIFY', selectedLoan.id)}
                       className="col-span-2 w-full bg-indigo-600 text-white font-bold py-2 rounded-lg flex justify-center items-center gap-2 hover:bg-indigo-700"
                     >
                       <Shield size={16} /> Verify Eligibility
                     </button>
                  )}
                  {selectedLoan.status === 'PENDING_APPROVAL' && (
                     <>
                       <button 
                         onClick={() => handleLoanAction('APPROVE', selectedLoan.id)}
                         className="bg-emerald-600 text-white font-bold py-2 rounded-lg flex justify-center items-center gap-2 hover:bg-emerald-700"
                       >
                         <CheckCircle size={16} /> Approve
                       </button>
                       <button 
                         onClick={() => handleLoanAction('REJECT', selectedLoan.id)}
                         className="bg-white border border-red-200 text-red-600 font-bold py-2 rounded-lg flex justify-center items-center gap-2 hover:bg-red-50"
                       >
                         <XCircle size={16} /> Reject
                       </button>
                     </>
                  )}
                  {selectedLoan.status === 'APPROVED' && (
                     <button 
                       onClick={() => handleLoanAction('DISBURSE', selectedLoan.id)}
                       className="col-span-2 bg-blue-600 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-900/20"
                     >
                       <Banknote size={18} /> Disburse Funds (Manual)
                     </button>
                  )}
               </div>
            </div>

            {/* 2. GUARANTORS SECTION */}
            <div>
               <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                 <User size={16} /> Guarantors
               </h3>
               <div className="space-y-3">
                 {selectedLoan.guarantors.map(g => (
                    <div key={g.id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                       <div>
                          <div className="font-bold text-sm text-slate-800">{g.user?.profile?.firstName || g.guarantorEmail}</div>
                          <div className="text-xs text-slate-500">Locks: KES {Number(g.amountLocked).toLocaleString()}</div>
                       </div>
                       
                       {/* Guarantor Status Actions */}
                       {g.status === 'PENDING_ADMIN_CHECK' && (
                          <button 
                            onClick={() => handleGuarantorVerify(g.id)}
                            className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-md hover:bg-indigo-100"
                          >
                            Silent Verify
                          </button>
                       )}
                       {g.status === 'ACCEPTED' && (
                          <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded text-xs font-bold">
                             <Lock size={12} /> Locked
                          </div>
                       )}
                       {g.status !== 'PENDING_ADMIN_CHECK' && g.status !== 'ACCEPTED' && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold">
                             {g.status.replace('PENDING_', '')}
                          </span>
                       )}
                    </div>
                 ))}
                 {selectedLoan.guarantors.length === 0 && <p className="text-sm text-slate-400 italic">No guarantors attached.</p>}
               </div>
            </div>

            {/* 3. DOCUMENTS */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                 <FileText size={16} /> Documents
               </h3>
               <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition cursor-pointer">
                  <Paperclip className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs text-slate-500 font-medium">Click to upload loan agreements or receipts</p>
               </div>
               <div className="mt-3 space-y-2">
                  {/* Placeholder for uploaded files list */}
                  {selectedLoan.documents?.map((doc, i) => (
                     <div key={i} className="flex items-center gap-2 text-sm text-blue-600 underline cursor-pointer">
                        <FileText size={14} /> {doc.name || `Document-${i+1}.pdf`}
                     </div>
                  ))}
               </div>
            </div>

            {/* 4. ADMIN NOTES (Timeline) */}
            <div>
               <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                 <MessageSquare size={16} /> Audit Trail & Notes
               </h3>
               <div className="space-y-4 mb-4">
                  {selectedLoan.notes?.map((note, i) => (
                     <div key={i} className="flex gap-3">
                        <div className="mt-1">
                           <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                        </div>
                        <div>
                           <div className="bg-slate-50 p-3 rounded-lg rounded-tl-none border border-slate-100">
                              <p className="text-sm text-slate-700">{note.content}</p>
                           </div>
                           <p className="text-[10px] text-slate-400 mt-1 pl-1">
                              {note.author?.profile?.firstName || 'Admin'} • {new Date(note.createdAt).toLocaleDateString()}
                           </p>
                        </div>
                     </div>
                  ))}
               </div>
               <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add internal note..."
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePostNote()}
                  />
                  <button 
                    onClick={handlePostNote}
                    className="bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-800"
                  >
                    <Send size={16} />
                  </button>
               </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}