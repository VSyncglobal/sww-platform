'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Banknote, CheckCircle, Clock, ArrowRight, Wallet, History } from 'lucide-react';

export default function FinanceOperationsPage() {
  const [activeTab, setActiveTab] = useState<'WITHDRAWALS' | 'MANUAL_DEPOSIT'>('WITHDRAWALS');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Manual Action States
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [manualRef, setManualRef] = useState('');

  // Manual Deposit Form
  const [depositForm, setDepositForm] = useState({ email: '', amount: '', ref: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Endpoint to fetch 'APPROVED_PENDING_DISBURSEMENT' requests
      // You might need to add this filter to GovernanceController findAll
      const res = await api.get('/governance/withdrawals?status=APPROVED_PENDING_DISBURSEMENT'); 
      setWithdrawals(res.data);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDisburse = async () => {
    if (!manualRef) return alert("Enter the Transaction Reference Code to confirm payment.");
    try {
      await api.patch(`/governance/withdrawals/${selectedId}/disburse`, { referenceCode: manualRef });
      alert("Disbursement Recorded!");
      setSelectedId(null); setManualRef(''); fetchData();
    } catch (e: any) { alert(e.response?.data?.message); }
  };

  const handleManualDeposit = async () => {
    // This requires a new endpoint: POST /transactions/deposit/manual
    try {
      await api.post('/transactions/deposit/manual', depositForm);
      alert("Deposit Recorded Successfully");
      setDepositForm({ email: '', amount: '', ref: '' });
    } catch (e: any) { alert("Failed: " + e.response?.data?.message); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold text-slate-900">Finance Operations</h1>
      
      {/* TABS */}
      <div className="flex gap-4 border-b border-slate-200 pb-1">
        <button 
          onClick={() => setActiveTab('WITHDRAWALS')}
          className={`px-4 py-2 font-bold text-sm ${activeTab === 'WITHDRAWALS' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
        >
          Pending Disbursements
        </button>
        <button 
          onClick={() => setActiveTab('MANUAL_DEPOSIT')}
          className={`px-4 py-2 font-bold text-sm ${activeTab === 'MANUAL_DEPOSIT' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
        >
          Record Cash Deposit
        </button>
      </div>

      {/* WITHDRAWAL QUEUE */}
      {activeTab === 'WITHDRAWALS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Approved Requests Queue</h3>
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-bold">
              {withdrawals.length} Pending
            </span>
          </div>
          
          <div className="divide-y divide-slate-100">
            {withdrawals.map((w) => (
              <div key={w.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                <div>
                  <div className="font-bold text-slate-900">KES {Number(w.amount).toLocaleString()}</div>
                  <div className="text-xs text-slate-500">To: {w.destination} • User: {w.user?.email}</div>
                </div>

                {selectedId === w.id ? (
                  <div className="flex gap-2 items-center animate-in slide-in-from-right-5">
                    <input 
                      type="text" 
                      placeholder="Enter M-Pesa Ref (e.g. QK...)" 
                      className="border border-slate-300 rounded px-3 py-1 text-sm w-48"
                      value={manualRef}
                      onChange={(e) => setManualRef(e.target.value)}
                    />
                    <button onClick={handleDisburse} className="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold">
                      Confirm
                    </button>
                    <button onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-slate-600">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setSelectedId(w.id)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800"
                  >
                    <Banknote size={16} /> Disburse
                  </button>
                )}
              </div>
            ))}
            {withdrawals.length === 0 && <div className="p-8 text-center text-slate-400">No approved requests pending payment.</div>}
          </div>
        </div>
      )}

      {/* MANUAL DEPOSIT FORM */}
      {activeTab === 'MANUAL_DEPOSIT' && (
        <div className="max-w-md bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-100 p-3 rounded-full text-emerald-700">
              <Wallet size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Record Deposit</h3>
              <p className="text-xs text-slate-500">For Cash or Direct Bank Transfers</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Member Email</label>
              <input 
                type="email" 
                className="w-full border border-slate-300 rounded-lg p-3 text-sm"
                placeholder="member@sww.com"
                value={depositForm.email}
                onChange={(e) => setDepositForm({...depositForm, email: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Amount (KES)</label>
              <input 
                type="number" 
                className="w-full border border-slate-300 rounded-lg p-3 text-sm font-bold"
                placeholder="0.00"
                value={depositForm.amount}
                onChange={(e) => setDepositForm({...depositForm, amount: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Reference Code</label>
              <input 
                type="text" 
                className="w-full border border-slate-300 rounded-lg p-3 text-sm"
                placeholder="Receipt / Transaction ID"
                value={depositForm.ref}
                onChange={(e) => setDepositForm({...depositForm, ref: e.target.value})}
              />
            </div>
            <button 
              onClick={handleManualDeposit}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 flex justify-center gap-2"
            >
              <CheckCircle size={18} /> Record Transaction
            </button>
          </div>
        </div>
      )}
    </div>
  );
}