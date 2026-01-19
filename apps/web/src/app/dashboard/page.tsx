'use client';

import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, PiggyBank, RefreshCw, ArrowUpRight } from 'lucide-react';
import api from '@/lib/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface DashboardStats {
  savings: number;
  loanBalance: number;
  transactionsCount: number;
  currency: string;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    savings: 0,
    loanBalance: 0,
    transactionsCount: 0,
    currency: 'KES'
  });
  const [loading, setLoading] = useState(true);

  const fetchLiveStats = async () => {
    setLoading(true);
    try {
      const [profileRes, txRes] = await Promise.all([
        api.get('/auth/profile'),
        api.get('/transactions')
      ]);

      setStats({
        savings: Number(profileRes.data.wallet?.savingsBalance || 0),
        loanBalance: Number(profileRes.data.wallet?.loanBalance || 0),
        transactionsCount: txRes.data.length || 0,
        currency: profileRes.data.wallet?.currency || 'KES'
      });
    } catch (e) {
      console.error("Sync Failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLiveStats(); }, []);

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Current'],
    datasets: [
      {
        label: 'Savings Growth',
        data: [0, 5000, 12000, 18000, 24000, stats.savings], 
        borderColor: '#1e3a8a',
        backgroundColor: 'rgba(30, 58, 138, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Financial Overview</h2>
          <p className="text-slate-500">Real-time portfolio performance.</p>
        </div>
        <button onClick={fetchLiveStats} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#1e3a8a] transition">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Sync Data
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group hover:border-blue-100 transition">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-[#1e3a8a] rounded-xl group-hover:bg-[#1e3a8a] group-hover:text-white transition">
              <PiggyBank size={24} />
            </div>
            <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} className="mr-1" /> Live
            </span>
          </div>
          <p className="text-slate-500 text-sm font-bold uppercase">Total Savings</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">
            {stats.currency} {stats.savings.toLocaleString()}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group hover:border-amber-100 transition">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 text-[#d97706] rounded-xl group-hover:bg-[#d97706] group-hover:text-white transition">
              <TrendingUp size={24} />
            </div>
            {stats.loanBalance > 0 && (
               <span className="flex items-center text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                 Active
               </span>
            )}
          </div>
          <p className="text-slate-500 text-sm font-bold uppercase">Loan Liability</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">
            {stats.currency} {stats.loanBalance.toLocaleString()}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group hover:border-indigo-100 transition">
          <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition">
                <Wallet size={24} />
             </div>
          </div>
          <p className="text-slate-500 text-sm font-bold uppercase">Total Transactions</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">
            {stats.transactionsCount}
          </h3>
        </div>
      </div>

      {/* CHART */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-80">
        <Line 
          options={{ 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { grid: { color: '#f3f4f6' } }, x: { grid: { display: false } } }
          }} 
          data={chartData} 
        />
      </div>
    </div>
  );
}