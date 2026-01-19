'use client';

import { useAuth } from '@/context/AuthContext';
import { User, Shield, Phone, Mail, Calendar, Key } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-emerald-600 h-32 relative">
            <div className="absolute -bottom-10 left-8 bg-white p-2 rounded-full shadow-md">
               <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold text-2xl">
                 {user.profile?.firstName?.[0]}
               </div>
            </div>
          </div>
          
          <div className="pt-12 pb-8 px-8">
            <h2 className="text-xl font-bold text-slate-900">
              {user.profile?.firstName} {user.profile?.lastName}
            </h2>
            <p className="text-slate-500 text-sm mb-6">{user.email}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">National ID</label>
                <div className="flex items-center gap-2 text-slate-700 font-medium bg-slate-50 p-3 rounded-lg">
                  <Shield size={18} className="text-slate-400" />
                  {/* Masked ID for security */}
                  {user.profile?.nationalId ? `****${user.profile.nationalId.slice(-4)}` : 'N/A'}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Phone Number</label>
                <div className="flex items-center gap-2 text-slate-700 font-medium bg-slate-50 p-3 rounded-lg">
                  <Phone size={18} className="text-slate-400" />
                  {user.phoneNumber}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security / Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Key size={18} className="text-emerald-600" /> Security
            </h3>
            <button className="w-full text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium transition">
              Change Password
            </button>
            <button className="w-full text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium transition mt-2">
              Manage Beneficiaries
            </button>
          </div>

          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6">
            <h3 className="font-bold text-blue-900 mb-2">Member Status</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-200 text-blue-800">
              {user.status || 'ACTIVE'}
            </span>
            <p className="text-xs text-blue-700 mt-2">
              Joined on {new Date(user.createdAt || Date.now()).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}