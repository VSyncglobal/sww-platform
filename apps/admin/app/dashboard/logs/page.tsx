'use client';

import { useEffect, useState } from 'react';
import { AdminDataService, AdminLog } from '@/services/admin-data.service';
import { Activity, RefreshCcw } from 'lucide-react';

export default function LogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await AdminDataService.getLogs();
      setLogs(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
         <div>
            <h1 className="text-3xl font-bold text-slate-900">System Audit Logs</h1>
            <p className="text-slate-500 mt-1">Track all financial movements and system actions.</p>
         </div>
         <button onClick={fetchData} className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">
            <RefreshCcw size={16} />
            <span>Refresh</span>
         </button>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
           <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Timestamp</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Action Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">User / Ref</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-md border border-gray-200">
                      {log.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{log.wallet?.user?.email || 'System'}</div>
                    <div className="text-xs text-slate-400 font-mono">Ref: {log.referenceCode}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-slate-900">KES {Number(log.amount).toLocaleString()}</span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-500">No logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}