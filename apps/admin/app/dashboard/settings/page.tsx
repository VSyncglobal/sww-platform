'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/context/AuthContext';
import { 
  Sliders, 
  Save, 
  Zap, 
  Activity,
  Lock
} from 'lucide-react';

interface SystemConfig {
  governance_mode: 'MANUAL' | 'HYBRID' | 'AUTO';
  features: {
    auto_loan_approval: boolean;
    auto_disbursement_b2c: boolean;
    strict_guarantor_check: boolean;
    welfare_automation: boolean;
    allow_manual_deposits: boolean;
  };
}

export default function AdminSettingsPage() {
  const { user } = useAdminAuth();
  const [loading, setLoading] = useState(false);

  // 1. ROLE CHECK: Only SUPER_ADMIN can edit
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Initial State (Safe Defaults)
  const [config, setConfig] = useState<SystemConfig>({
    governance_mode: 'MANUAL',
    features: {
      auto_loan_approval: false,
      auto_disbursement_b2c: false, 
      strict_guarantor_check: true,
      welfare_automation: false,
      allow_manual_deposits: true
    }
  });

  const toggleFeature = (key: keyof typeof config.features) => {
    if (!isSuperAdmin) return; // Block interaction
    setConfig(prev => ({
      ...prev,
      features: { 
        ...prev.features, 
        [key]: !prev.features[key] 
      }
    }));
  };

  const handleModeChange = (mode: 'MANUAL' | 'HYBRID' | 'AUTO') => {
    if (!isSuperAdmin) return; // Block interaction
    setConfig({ ...config, governance_mode: mode });
  };

  const handleSave = async () => {
    if (!isSuperAdmin) return;
    setLoading(true);
    try {
      // In production: await api.post('/system/config', config);
      await new Promise(r => setTimeout(r, 800)); // Simulate network
      alert("Operational Configuration Updated Successfully");
    } catch (e) {
      alert("Failed to update system rules");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Operational Control</h1>
          <p className="text-slate-500 mt-1">Manage governance workflows and automation logic.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading || !isSuperAdmin}
          className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 
            ${isSuperAdmin 
              ? 'bg-slate-900 text-white hover:bg-black' 
              : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}
        >
          {loading ? <Activity className="animate-spin" size={18} /> : <Save size={18} />}
          <span>{isSuperAdmin ? 'Apply Rules' : 'Read Only'}</span>
        </button>
      </div>

      {/* RESTRICTION BANNER */}
      {!isSuperAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800">
          <Lock size={20} />
          <p className="text-sm font-medium">
            <strong>Restricted Access:</strong> Only Super Admins can modify critical system configurations. You are viewing this page in Read-Only mode.
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* COLUMN 1: GOVERNANCE AUTHORITY */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-purple-100 p-3 rounded-xl text-purple-700"><Sliders size={24} /></div>
            <div>
              <h2 className="font-bold text-xl text-slate-900">Governance Mode</h2>
              <p className="text-sm text-slate-500">Global Authority Level</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {[
              { id: 'MANUAL', label: 'Manual Control', desc: 'All transactions require human sign-off.' },
              { id: 'HYBRID', label: 'Hybrid Assist', desc: 'Small routine transactions are automated.' },
              { id: 'AUTO', label: 'Autonomous', desc: 'Full AI decision making (High Risk).' }
            ].map((mode) => (
              <label 
                key={mode.id} 
                className={`flex items-start p-4 rounded-xl border-2 transition-all 
                  ${config.governance_mode === mode.id ? 'border-purple-600 bg-purple-50' : 'border-slate-100'}
                  ${isSuperAdmin ? 'cursor-pointer hover:border-slate-200' : 'cursor-not-allowed opacity-75'}
                `}
              >
                <input 
                  type="radio" 
                  name="governance" 
                  className="mt-1 accent-purple-600 h-5 w-5"
                  checked={config.governance_mode === mode.id}
                  onChange={() => handleModeChange(mode.id as any)}
                  disabled={!isSuperAdmin}
                />
                <div className="ml-4">
                  <span className={`block text-sm font-bold ${config.governance_mode === mode.id ? 'text-purple-900' : 'text-slate-700'}`}>
                    {mode.label}
                  </span>
                  <span className="block text-xs text-slate-500 mt-1">{mode.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* COLUMN 2: AUTOMATION SWITCHES */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-amber-100 p-3 rounded-xl text-amber-700"><Zap size={24} /></div>
            <div>
              <h2 className="font-bold text-xl text-slate-900">Automation Logic</h2>
              <p className="text-sm text-slate-500">Toggle operational features</p>
            </div>
          </div>
          
          <div className="space-y-8">
            {/* 1. AUTO DISBURSEMENT */}
            <div className="flex justify-between items-start group">
              <div className="pr-4">
                <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  Auto Disbursement (B2C)
                  <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">HIGH RISK</span>
                </p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  If enabled, approved loans/withdrawals are sent via M-Pesa immediately via API.
                  <br /><span className="text-slate-500 italic">Manual Mode requires Treasurer to input Ref Codes.</span>
                </p>
              </div>
              <button 
                onClick={() => toggleFeature('auto_disbursement_b2c')}
                disabled={!isSuperAdmin}
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 flex-shrink-0 
                  ${config.features.auto_disbursement_b2c ? 'bg-emerald-500' : 'bg-slate-200'}
                  ${!isSuperAdmin && 'opacity-50 cursor-not-allowed'}
                `}
              >
                <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${config.features.auto_disbursement_b2c ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <hr className="border-slate-100" />

            {/* 2. STRICT GUARANTORS */}
            <div className="flex justify-between items-start">
              <div className="pr-4">
                <p className="font-bold text-slate-800 text-sm">Strict Guarantor Checks</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Prevents loan submission if selected guarantors do not have sufficient <strong>Free Savings</strong>.
                </p>
              </div>
              <button 
                onClick={() => toggleFeature('strict_guarantor_check')} 
                disabled={!isSuperAdmin}
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 flex-shrink-0 
                  ${config.features.strict_guarantor_check ? 'bg-emerald-500' : 'bg-slate-200'}
                  ${!isSuperAdmin && 'opacity-50 cursor-not-allowed'}
                `}
              >
                <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${config.features.strict_guarantor_check ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <hr className="border-slate-100" />

            {/* 3. AUTO LOAN APPROVAL */}
            <div className="flex justify-between items-start">
              <div className="pr-4">
                <p className="font-bold text-slate-800 text-sm">Auto Loan Approval</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Instantly approves loans if 100% covered by user's own savings (Self-Guaranteed).
                </p>
              </div>
              <button 
                onClick={() => toggleFeature('auto_loan_approval')} 
                disabled={!isSuperAdmin}
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 flex-shrink-0 
                  ${config.features.auto_loan_approval ? 'bg-emerald-500' : 'bg-slate-200'}
                  ${!isSuperAdmin && 'opacity-50 cursor-not-allowed'}
                `}
              >
                <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${config.features.auto_loan_approval ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <hr className="border-slate-100" />

            {/* 4. MANUAL DEPOSITS */}
            <div className="flex justify-between items-start">
              <div className="pr-4">
                <p className="font-bold text-slate-800 text-sm">Allow Manual Deposits</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Allows Admins to manually record Cash/Bank transfers in the Finance Ops panel.
                </p>
              </div>
              <button 
                onClick={() => toggleFeature('allow_manual_deposits')} 
                disabled={!isSuperAdmin}
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 flex-shrink-0 
                  ${config.features.allow_manual_deposits ? 'bg-emerald-500' : 'bg-slate-200'}
                  ${!isSuperAdmin && 'opacity-50 cursor-not-allowed'}
                `}
              >
                <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${config.features.allow_manual_deposits ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}