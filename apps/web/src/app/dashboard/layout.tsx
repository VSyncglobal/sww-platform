'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Wallet, PiggyBank, TrendingUp, Settings, LogOut, Menu, X, User as UserIcon } from 'lucide-react';
import api from '@/lib/api'; // Ensure this exists from previous steps

// Type for the User Profile
interface UserProfile {
  id: string;
  email: string;
  profile?: {
    firstName: string;
    lastName: string;
  };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // 1. FETCH USER DATA ON MOUNT
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/auth/profile'); // Assuming this endpoint exists, or we use /members/me
        setUser(data);
      } catch (error) {
        console.error('Session expired');
        router.push('/'); // Redirect to landing if unauthorized
      }
    };
    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const menuItems = [
    { name: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'My Deposits', icon: Wallet, href: '/dashboard/deposits' },
    { name: 'Loans', icon: TrendingUp, href: '/dashboard/loans' },
    { name: 'Welfare', icon: PiggyBank, href: '/dashboard/welfare' }, // Welfare logic needs definition
    { name: 'Settings', icon: Settings, href: '/dashboard/settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-gray-900">
      {/* MOBILE OVERLAY */}
      <div 
        className={`fixed inset-0 bg-black/50 z-20 lg:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* SIDEBAR */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#1e3a8a] text-white transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* LOGO */}
        <div className="h-20 flex items-center gap-3 px-6 border-b border-blue-800">
           <div className="w-8 h-8 bg-[#d97706] rounded-lg flex items-center justify-center">
              <span className="text-[#1e3a8a] font-black text-lg">SM</span>
           </div>
           <div>
              <h1 className="font-bold text-lg leading-none">SM Welfare</h1>
              <span className="text-xs text-blue-300 uppercase tracking-widest">Member Panel</span>
           </div>
        </div>

        {/* NAVIGATION */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-[#d97706] text-[#1e3a8a] font-bold shadow-lg' 
                    : 'text-blue-100 hover:bg-white/10'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-[#1e3a8a]' : 'text-blue-300 group-hover:text-white'} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* LOGOUT */}
        <div className="absolute bottom-0 w-full p-4 border-t border-blue-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-200 hover:bg-red-900/20 hover:text-red-100 rounded-xl transition"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            {isSidebarOpen ? <X /> : <Menu />}
          </button>

          <h2 className="text-xl font-bold text-gray-800 hidden md:block">Dashboard</h2>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              {/* HYDRATED DATA */}
              <p className="text-sm font-bold text-gray-900">
                {user?.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName}` : 'Loading...'}
              </p>
              <p className="text-xs text-gray-500">
                ID: {user?.id ? `#${user.id.substring(0, 4)}` : '...'}
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm text-gray-400">
               <UserIcon size={20} />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}