'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function GuarantorPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingId, setSigningId] = useState<string | null>(null);
  const [signature, setSignature] = useState('');

  const fetchRequests = async () => {
    try {
      // FIX: URL corrected to match backend controller
      const res = await api.get('/loans/guarantors/incoming'); 
      setRequests(res.data);
    } catch (e) { 
      console.error("Failed to fetch requests", e); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleResponse = async (id: string, action: 'ACCEPT' | 'REJECT') => {
    try {
      // Matches the POST endpoint in the updated controller below
      await api.post(`/loans/guarantor/${id}/respond`, {
        action,
        signature: action === 'ACCEPT' ? signature : undefined
      });
      
      setSigningId(null);
      setSignature('');
      fetchRequests();
      alert(`Successfully ${action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED'} the request.`);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Operation failed');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Guarantor Requests</h1>
        <p className="text-gray-500 mt-1">Review and action loan guarantee requests from other members.</p>
      </div>
      
      {requests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 font-medium">You have no pending guarantor requests.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map(req => (
            <div key={req.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
              
              <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 gap-4">
                <div>
                  <h3 className="font-bold text-lg text-emerald-950">
                    Loan Request from {req.loan.user.profile.firstName} {req.loan.user.profile.lastName}
                  </h3>
                  <div className="text-sm text-gray-500 mt-1 flex flex-col gap-1">
                    <span>Amount Requested: <span className="font-semibold text-gray-900">KES {Number(req.loan.principal).toLocaleString()}</span></span>
                    <span>Date Applied: {new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold w-fit
                  ${req.status === 'PENDING_GUARANTOR_ACTION' ? 'bg-yellow-100 text-yellow-800' : 
                    req.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {req.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg flex gap-3 items-start mb-6 border border-blue-100">
                <AlertTriangle className="text-blue-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm text-blue-900 font-bold">Financial Commitment Required</p>
                  <p className="text-sm text-blue-800 mt-1 leading-relaxed">
                    By accepting, <strong>KES {Number(req.amountLocked).toLocaleString()}</strong> of your savings 
                    will be locked as collateral. You cannot withdraw these funds until the borrower fully repays the loan.
                  </p>
                </div>
              </div>

              {req.status === 'PENDING_GUARANTOR_ACTION' && (
                <div className="border-t border-gray-100 pt-4">
                  {signingId === req.id ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 bg-gray-50 p-4 rounded-lg">
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
                        Digital Signature Verification
                      </label>
                      <p className="text-xs text-gray-600 mb-3">
                        Please type your first name <strong>"{user?.profile?.firstName}"</strong> to confirm you understand the liability.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input 
                          type="text" 
                          placeholder={user?.profile?.firstName || "Your First Name"}
                          className="flex-1 border-2 border-emerald-500 rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-200"
                          value={signature}
                          onChange={(e) => setSignature(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleResponse(req.id, 'ACCEPT')}
                            disabled={!signature}
                            className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Confirm Acceptance
                          </button>
                          <button 
                            onClick={() => { setSigningId(null); setSignature(''); }}
                            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setSigningId(req.id)}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-emerald-700 transition shadow-sm hover:shadow"
                      >
                        <CheckCircle size={18} /> Accept Liability
                      </button>
                      <button 
                        onClick={() => handleResponse(req.id, 'REJECT')}
                        className="flex items-center gap-2 bg-white border border-red-200 text-red-600 px-5 py-2.5 rounded-lg font-bold hover:bg-red-50 transition"
                      >
                        <XCircle size={18} /> Reject Request
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}