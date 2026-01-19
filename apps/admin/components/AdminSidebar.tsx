'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
// FIX: Added 'Banknote' to the import list
import { LayoutDashboard, Users, Wallet, Activity, LogOut, ShieldCheck, UserCircle, Settings, Banknote } from 'lucide-react';
import { useAdminAuth } from '@/context/AuthContext';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAdminAuth();

  const menuItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Loan Governance', href: '/dashboard/loans', icon: ShieldCheck },
    { name: 'Finance Ops', href: '/dashboard/finance', icon: Banknote },
    { name: 'Members', href: '/dashboard/members', icon: Users },
    { name: 'Savings Records', href: '/dashboard/savings', icon: Wallet },
    { name: 'System Logs', href: '/dashboard/logs', icon: Activity },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col fixed left-0 top-0 border-r border-slate-800 z-50 transition-all">
      {/* HEADER */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center font-bold">A</div>
        <div>
           <h1 className="text-lg font-bold tracking-tight text-white">SWW Console</h1>
           <p className="text-[10px] text-slate-400">v1.0.0-beta</p>
        </div>
      </div>

      {/* USER PROFILE SNIPPET */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3">
            <div className="bg-slate-700 p-2 rounded-full">
                <UserCircle size={20} className="text-slate-300" />
            </div>
            <div className="overflow-hidden">
                <p className="text-sm font-bold truncate text-white">
                    {user?.firstName || 'Admin'} {user?.lastName || 'User'}
                </p>
                <p className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">
                    {user?.role?.replace('_', ' ')}
                </p>
            </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={logout}
          className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}