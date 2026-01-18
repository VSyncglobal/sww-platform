'use client';

import { useEffect, useState } from 'react';
import { AdminDataService, AdminMember } from '@/services/admin-data.service';
import { Wallet, RefreshCcw } from 'lucide-react';

export default function SavingsPage() {
  const [data, setData] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await AdminDataService.getMembers();
      // Filter out users without wallets (e.g. pure admins)
      setData(res.filter(m => m.wallet));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const totalSavings = data.reduce((sum, m) => sum + Number(m.wallet?.savingsBalance || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-3xl font-bold text-slate-900">Savings & Liquidity</h1>
           <p className="text-slate-500 mt-1">Monitor member deposits and loan liabilities.</p>
        </div>
        <div className="bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100 text-emerald-800 font-bold">
           Total Pool: KES {totalSavings.toLocaleString()}
        </div>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
           <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Member Account</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Current Savings</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Loan Liability</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Net Position</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.map((m) => {
                const savings = Number(m.wallet?.savingsBalance || 0);
                const debt = Number(m.wallet?.loanBalance || 0);
                return (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900">{m.profile?.firstName || 'User'} {m.profile?.lastName}</div>
                      <div className="text-xs text-slate-500">{m.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-emerald-600">KES {savings.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-red-600">KES {debt.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      KES {(savings - debt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}