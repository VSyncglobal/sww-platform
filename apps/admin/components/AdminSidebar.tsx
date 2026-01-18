'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Wallet, Activity, LogOut, ShieldCheck } from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/login');
  };

  // ✅ UPDATED ROUTES
  const menuItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Loan Governance', href: '/dashboard/loans', icon: ShieldCheck }, // Updated path
    { name: 'Members', href: '/dashboard/members', icon: Users },
    { name: 'Savings Records', href: '/dashboard/savings', icon: Wallet },
    { name: 'System Logs', href: '/dashboard/logs', icon: Activity },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col fixed left-0 top-0 border-r border-slate-800 z-50">
      {/* HEADER */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center font-bold">A</div>
        <div>
           <h1 className="text-lg font-bold tracking-tight text-white">SWW Console</h1>
           <p className="text-[10px] text-slate-400">v1.0.0-beta</p>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          // Highlight logic: Exact match OR sub-path match (e.g. /dashboard/loans/123)
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
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}