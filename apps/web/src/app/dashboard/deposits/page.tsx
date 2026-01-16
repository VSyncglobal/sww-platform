'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Search, Calendar, Download, Loader2, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

// Define what a Transaction looks like
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

  // 1. FETCH DATA
  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/transactions');
      setTransactions(res.data);
    } catch (error) {
      console.error("Failed to fetch transactions", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // 2. HANDLE DEPOSIT FORM
  const { register, handleSubmit, reset } = useForm();

  const onDeposit = async (data: any) => {
    setIsProcessing(true);
    try {
      // Send deposit request
      await api.post('/transactions/deposit', {
        amount: Number(data.amount),
        phoneNumber: data.phoneNumber // Ensure backend handles this or uses profile phone
      });
      
      // On success
      setDepositModalOpen(false);
      reset();
      fetchTransactions(); // Refresh table
      alert('Deposit Initiated! Check your phone for M-Pesa prompt.');
    } catch (error) {
      console.error(error);
      alert('Deposit Failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Deposits</h1>
          <p className="text-gray-500 text-sm">Manage your savings and view transaction history.</p>
        </div>
        
        <button 
          onClick={() => setDepositModalOpen(true)}
          className="bg-[#d97706] hover:bg-[#b45309] text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-transform hover:-translate-y-1"
        >
          <Plus size={20} />
          New Deposit
        </button>
      </div>

      {/* SEARCH BAR (Visual Only for now) */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-800"
          />
        </div>
        <button onClick={fetchTransactions} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading your history...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No deposits found. Start saving today!</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Reference</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Amount (KES)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-blue-50/50 transition">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-900">{tx.reference || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      tx.status === 'COMPLETED' ? 'bg-green-100 text-green-800 border-green-200' :
                      tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                      'bg-red-100 text-red-800 border-red-200'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                    {tx.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* DEPOSIT MODAL */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-blue-900/80 backdrop-blur-sm" onClick={() => setDepositModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 animate-in zoom-in-95">
            <h2 className="text-2xl font-bold text-[#1e3a8a] mb-2">Make a Deposit</h2>
            <p className="text-gray-500 mb-6">Enter details to trigger M-Pesa STK Push.</p>
            
            <form onSubmit={handleSubmit(onDeposit)} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Amount (KES)</label>
                <input 
                  {...register('amount', { required: true })}
                  type="number" 
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-[#d97706] outline-none font-mono text-lg" 
                  placeholder="e.g. 1000" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">M-Pesa Number</label>
                <input 
                  {...register('phoneNumber', { required: true })}
                  type="text" 
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-[#d97706] outline-none font-mono text-lg" 
                  placeholder="2547..." 
                />
              </div>

              <button 
                disabled={isProcessing}
                className="w-full bg-[#1e3a8a] text-white py-4 rounded-xl font-bold hover:bg-blue-900 transition shadow-lg flex justify-center"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : 'Pay with M-Pesa'}
              </button>
              
              <button 
                type="button"
                onClick={() => setDepositModalOpen(false)}
                className="w-full text-gray-500 py-2 hover:text-gray-700 font-medium"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}