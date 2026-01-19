'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function AdminWelfarePage() {
  const [claims, setClaims] = useState<any[]>([]);

  useEffect(() => {
    api.get('/welfare/admin/all').then(res => setClaims(res.data));
  }, []);

  const handleReview = async (id: string, status: string) => {
    const notes = prompt("Enter review notes:");
    if (!notes) return;
    await api.patch(`/welfare/${id}/review`, { status, notes });
    // Refresh list
    const res = await api.get('/welfare/admin/all');
    setClaims(res.data);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Welfare Claims Review</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Member</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Type & Description</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Evidence</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {claims.map((claim) => (
              <tr key={claim.id}>
                <td className="px-6 py-4">
                   <div className="font-bold text-slate-900">{claim.user.profile?.firstName} {claim.user.profile?.lastName}</div>
                   <div className="text-xs text-slate-500">{claim.user.email}</div>
                </td>
                <td className="px-6 py-4 max-w-xs">
                   <div className="font-bold text-slate-700">{claim.type}</div>
                   <div className="text-sm text-slate-500 truncate">{claim.description}</div>
                   <div className="text-xs font-bold mt-1">KES {claim.amountRequested.toLocaleString()}</div>
                </td>
                <td className="px-6 py-4">
                   {claim.documentUrl ? (
                     <a href={claim.documentUrl} target="_blank" className="flex items-center gap-1 text-blue-600 hover:underline text-sm font-medium">
                       View Doc <ExternalLink size={14} />
                     </a>
                   ) : <span className="text-slate-400 text-sm">No File</span>}
                </td>
                <td className="px-6 py-4">
                   <span className={`px-2 py-1 rounded-full text-xs font-bold 
                     ${claim.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                       claim.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                     {claim.status}
                   </span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                   {claim.status === 'PENDING' && (
                     <>
                        <button onClick={() => handleReview(claim.id, 'APPROVED')} className="text-green-600 bg-green-50 p-2 rounded hover:bg-green-100"><CheckCircle size={18}/></button>
                        <button onClick={() => handleReview(claim.id, 'REJECTED')} className="text-red-600 bg-red-50 p-2 rounded hover:bg-red-100"><XCircle size={18}/></button>
                     </>
                   )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}