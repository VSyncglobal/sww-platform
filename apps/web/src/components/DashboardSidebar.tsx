'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Banknote, HeartPulse, FileText, Settings, Users, ArrowLeftRight, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const menuItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Loans', href: '/dashboard/loans', icon: Banknote },
    { name: 'Requests', href: '/dashboard/guarantors', icon: Users },
    { name: 'Deposits', href: '/dashboard/deposits', icon: ArrowLeftRight },
    { name: 'Welfare', href: '/dashboard/welfare', icon: HeartPulse },
    { name: 'Reports', href: '/dashboard/reports', icon: FileText },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-[#0f172a] text-slate-300 h-screen fixed left-0 top-0 hidden lg:flex flex-col z-50 shadow-2xl">
      {/* Branding Area */}
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 bg-gradient-to-br from-emerald-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">
            S
          </div>
          <div>
            <h1 className="font-bold text-white text-lg tracking-tight">SWW Platform</h1>
            <p className="text-[10px] text-emerald-400 font-medium uppercase tracking-widest">Member Portal</p>
          </div>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
      </div>

      {/* Navigation */}
      <div className="px-4 space-y-1 overflow-y-auto flex-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium text-sm group relative overflow-hidden
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'hover:bg-slate-800 hover:text-white'
                }`}
            >
              <item.icon 
                size={20} 
                className={`transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-emerald-400'}`} 
              />
              <span className="relative z-10">{item.name}</span>
              
              {/* Active Glow Indicator */}
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/30 rounded-l-full"></div>
              )}
            </Link>
          );
        })}
      </div>
      
      {/* Footer */}
      <div className="p-4 m-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
        <button 
          onClick={logout}
          className="flex items-center gap-3 w-full text-left text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}