'use client';

import { ArrowUpRight, ArrowDownRight, Wallet, DollarSign } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      
      {/* 1. WELCOME SECTION */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500">Welcome back, here is your financial summary.</p>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Savings Card */}
        <div className="bg-[#1e3a8a] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <Wallet size={24} className="text-[#d97706]" />
            </div>
            <span className="flex items-center text-xs font-bold bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
              +12% <ArrowUpRight size={12} className="ml-1" />
            </span>
          </div>
          <p className="text-blue-200 text-sm font-medium">Total Savings</p>
          <h3 className="text-3xl font-bold mt-1">KES 120,500</h3>
        </div>

        {/* Loan Limit Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 rounded-xl">
              <DollarSign size={24} className="text-[#d97706]" />
            </div>
          </div>
          <p className="text-gray-500 text-sm font-medium">Loan Limit (3x)</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-1">KES 360,000</h3>
        </div>

        {/* Welfare Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
           <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <ArrowDownRight size={24} className="text-[#1e3a8a]" />
            </div>
          </div>
          <p className="text-gray-500 text-sm font-medium">Welfare Contributions</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-1">KES 15,000</h3>
        </div>
      </div>

      {/* 3. RECENT ACTIVITY TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900">Recent Transactions</h3>
          <button className="text-sm text-[#1e3a8a] font-bold hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[1, 2, 3].map((i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">#TRX-882{i}</td>
                  <td className="px-6 py-4">Monthly Deposit</td>
                  <td className="px-6 py-4 text-gray-500">Jan {10 + i}, 2026</td>
                  <td className="px-6 py-4 font-bold text-green-600">+ KES 5,000</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Completed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}