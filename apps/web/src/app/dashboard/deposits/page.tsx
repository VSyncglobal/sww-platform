'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Search, Loader2, RefreshCw, Smartphone } from 'lucide-react';
import api from '@/lib/api';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  reference: string;
  createdAt: string;
}

export default function DepositsPage() {
  const [isDepositModalOpen, setDepositModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/transactions');
      setTransactions(res.data);
    } catch (error) { console.error(error); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchTransactions(); }, []);

  const { register, handleSubmit, reset } = useForm();

  const onDeposit = async (data: any) => {
    setIsProcessing(true);
    try {
      await api.post('/transactions/deposit', {
        amount: Number(data.amount),
        phoneNumber: data.phoneNumber
      });
      setDepositModalOpen(false); reset(); fetchTransactions();
      alert('STK Push Sent! Check your phone.');
    } catch (error) { alert('Deposit Failed.'); } 
    finally { setIsProcessing(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Deposits</h1>
          <p className="text-slate-500 font-medium mt-1">Grow your savings securely via M-Pesa.</p>
        </div>
        
        <button 
          onClick={() => setDepositModalOpen(true)}
          className="bg-gradient-to-r from-[#d97706] to-amber-600 hover:to-amber-700 text-white px-8 py-3 rounded-xl font-bold shadow-xl shadow-amber-500/20 flex items-center gap-2 transition-all hover:-translate-y-1"
        >
          <Smartphone size={20} />
          M-Pesa Deposit
        </button>
      </div>

      <div className="card-vibe overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4 bg-white">
           <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by reference..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-0 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
              />
           </div>
           <button onClick={fetchTransactions} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition">
              <RefreshCw size={18} />
           </button>
        </div>

        {isLoading ? (
          <div className="p-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-slate-300" /></div>
        ) : (
          <table className="w-full text-left">
            <thead className="glass-header">
              <tr>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Reference</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.map((tx) => (
                <tr key={tx.id} className="table-row-hover">
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-700 bg-slate-50/50 w-fit rounded-lg px-2 py-1">
                    {tx.reference || '---'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                      tx.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-100' :
                      tx.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                      'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-slate-900 text-right">
                    KES {tx.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDepositModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-slate-800 mb-2">Load Wallet</h2>
            <p className="text-slate-500 mb-8 font-medium">Enter amount to trigger STK Push.</p>
            
            <form onSubmit={handleSubmit(onDeposit)} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Amount (KES)</label>
                <input 
                  {...register('amount', { required: true })}
                  type="number" 
                  className="w-full bg-slate-50 border-0 rounded-xl p-4 font-black text-slate-800 text-xl focus:ring-2 focus:ring-amber-500" 
                  placeholder="1000" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">M-Pesa Phone</label>
                <input 
                  {...register('phoneNumber', { required: true })}
                  type="text" 
                  className="w-full bg-slate-50 border-0 rounded-xl p-4 font-bold text-slate-800 focus:ring-2 focus:ring-amber-500" 
                  placeholder="2547..." 
                />
              </div>

              <button 
                disabled={isProcessing}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition shadow-lg flex justify-center items-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <>Pay Now <Loader2 size={18} /></>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}