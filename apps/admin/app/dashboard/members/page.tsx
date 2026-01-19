'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api'; // Use direct API for actions
import { AdminDataService, AdminMember } from '@/services/admin-data.service';
import { User, RefreshCcw, CheckCircle, Loader2 } from 'lucide-react';

export default function MembersPage() {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await AdminDataService.getMembers();
      setMembers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if(!confirm("Activate this member?")) return;
    setActionLoading(id);
    try {
        await api.patch(`/members/${id}/approve`);
        await fetchData(); // Refresh list
    } catch (e: any) {
        alert(e.response?.data?.message || 'Failed to approve member');
    } finally {
        setActionLoading(null);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-slate-900">Member Registry</h1>
           <p className="text-slate-500 mt-1">View and manage member profiles.</p>
        </div>
        <button onClick={fetchData} className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">
           <RefreshCcw size={16} />
           <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
           <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Profile</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Role</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mr-3 font-bold">
                        {m.profile?.firstName?.[0] || 'U'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{m.profile?.firstName || 'Admin'} {m.profile?.lastName}</div>
                        <div className="text-xs text-slate-500">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                      {m.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${m.status === 'ACTIVE' ? 'text-green-700 bg-green-50' : 'text-yellow-700 bg-yellow-50'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {m.status === 'PENDING' && (
                        <button 
                            onClick={() => handleApprove(m.id)}
                            disabled={actionLoading === m.id}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {actionLoading === m.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                            Approve
                        </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}