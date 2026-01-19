'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { FileText, Download } from 'lucide-react';

interface Report {
  id: string;
  month: string;
  totalSaved: number;
  totalBorrowed: number;
  netPosition: number;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    // 1. Fetch Reports (We need to create this endpoint in ReportsController)
    api.get('/reports/my-reports').then(res => setReports(res.data)).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Monthly Statements</h1>
        <button className="flex items-center gap-2 text-blue-600 font-bold hover:bg-blue-50 px-4 py-2 rounded-lg transition">
          <Download size={18} /> Download All
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase">Period</th>
              <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase text-right">Saved</th>
              <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase text-right">Borrowed</th>
              <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase text-right">Net Position</th>
              <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.length === 0 ? (
               <tr><td colSpan={5} className="p-8 text-center text-slate-400">No monthly reports generated yet.</td></tr>
            ) : reports.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{r.month}</td>
                <td className="px-6 py-4 text-emerald-600 font-bold text-right">+{r.totalSaved.toLocaleString()}</td>
                <td className="px-6 py-4 text-red-600 font-bold text-right">-{r.totalBorrowed.toLocaleString()}</td>
                <td className="px-6 py-4 text-slate-700 font-bold text-right">{r.netPosition.toLocaleString()}</td>
                <td className="px-6 py-4 text-center">
                  <button className="text-blue-600 hover:underline text-sm font-medium">View PDF</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}