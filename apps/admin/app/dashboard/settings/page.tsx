'use client';

import { useAdminAuth } from '@/context/AuthContext';
import { Sliders, Lock, ShieldAlert, Save } from 'lucide-react';
import { useState } from 'react';

export default function AdminSettingsPage() {
  const { user } = useAdminAuth();
  
  // Mock config state (In real app, fetch from /api/config)
  const [config, setConfig] = useState({
    governanceMode: 'MANUAL',
    autoLoanApproval: false,
    strictGuarantorCheck: true,
  });

  const handleSave = () => {
    // In real app: api.post('/config', config)
    alert('System Configuration Updated. Governance mode is now: ' + config.governanceMode);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold text-slate-900">System Configuration</h1>
      <p className="text-slate-500">Manage global governance rules and automation switches.</p>

      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* GOVERNANCE MODE */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-100 p-2 rounded-lg text-purple-700">
              <Sliders size={24} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900">Governance Mode</h2>
              <p className="text-xs text-slate-500">Controls the level of human intervention.</p>
            </div>
          </div>

          <div className="space-y-3">
            {['MANUAL', 'HYBRID', 'AUTO'].map((mode) => (
              <label key={mode} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${config.governanceMode === mode ? 'border-purple-600 bg-purple-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input 
                  type="radio" 
                  name="governance" 
                  className="accent-purple-600 h-5 w-5"
                  checked={config.governanceMode === mode}
                  onChange={() => setConfig({ ...config, governanceMode: mode })}
                />
                <div className="ml-3">
                  <span className="block text-sm font-bold text-slate-900">{mode} Mode</span>
                  <span className="block text-xs text-slate-500">
                    {mode === 'MANUAL' && 'Full human sign-off required.'}
                    {mode === 'HYBRID' && 'Small loans auto-approved.'}
                    {mode === 'AUTO' && 'AI-driven decisions.'}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* SECURITY FLAGS */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-red-100 p-2 rounded-lg text-red-700">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900">Risk Controls</h2>
              <p className="text-xs text-slate-500">Toggle critical safety checks.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Strict Guarantor Checks</span>
              <button 
                onClick={() => setConfig({ ...config, strictGuarantorCheck: !config.strictGuarantorCheck })}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${config.strictGuarantorCheck ? 'bg-green-500' : 'bg-slate-300'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${config.strictGuarantorCheck ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            <p className="text-xs text-slate-400">If enabled, loans cannot be submitted without valid guarantors.</p>
            
            <hr className="border-slate-100" />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Auto-Disbursement (B2C)</span>
              <button 
                onClick={() => setConfig({ ...config, autoLoanApproval: !config.autoLoanApproval })}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${config.autoLoanApproval ? 'bg-green-500' : 'bg-slate-300'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${config.autoLoanApproval ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            <p className="text-xs text-slate-400">Allows M-Pesa API to release funds without Treasurer click.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition"
        >
          <Save size={18} /> Save Configuration
        </button>
      </div>
    </div>
  );
}