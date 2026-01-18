'use client';

import { useEffect, useState } from 'react';
import { Users, Wallet, CreditCard, Activity, TrendingUp } from 'lucide-react';
// import api from '@/lib/api'; // (Uncomment when endpoints exist)

export default function DashboardHome() {
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalSavings: 0,
    activeLoans: 0,
    pendingLoans: 0
  });

  useEffect(() => {
    // Phase 7: Replace with `await api.get('/stats')`
    setTimeout(() => {
      setStats({
        totalMembers: 5, // Based on our seed
        totalSavings: 150000, 
        activeLoans: 1,
        pendingLoans: 2
      });
    }, 800);
  }, []);

  const cards = [
    { label: 'Total Members', value: stats.totalMembers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Total Savings', value: `KES ${stats.totalSavings.toLocaleString()}`, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Active Loans', value: stats.activeLoans, icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    { label: 'Pending Approvals', value: stats.pendingLoans, icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Dashboard Overview</h2>
          <p className="text-slate-500 mt-1">Real-time financial insights and governance metrics.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-500 shadow-sm">
          Last updated: Today, 12:00 PM
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.label} className={`bg-white p-6 rounded-xl shadow-sm border ${card.border} hover:shadow-md transition-shadow`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-2">{card.value}</h3>
              </div>
              <div className={`p-3 rounded-lg ${card.bg}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* RECENT ACTIVITY SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Area (Placeholder) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Savings Growth</h3>
            <TrendingUp className="text-emerald-500 h-5 w-5" />
          </div>
          <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center border border-dashed border-slate-300">
            <p className="text-slate-400">Chart Visualization (Phase 7)</p>
          </div>
        </div>

        {/* Action Feed */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Pending Actions</h3>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="h-2 w-2 mt-2 rounded-full bg-orange-500"></div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Loan Approval Required</p>
                  <p className="text-xs text-slate-500">Member #100{i} • KES 50,000</p>
                </div>
              </div>
            ))}
            <button className="w-full mt-2 text-sm text-blue-600 font-medium hover:underline">
              View all tasks →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}