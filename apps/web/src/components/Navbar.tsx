'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { User, LogOut, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
          S
        </div>
        <span className="font-bold text-xl tracking-tight text-emerald-900">SWW Platform</span>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-bold text-gray-900">
                {user.profile?.firstName} {user.profile?.lastName}
              </span>
              <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase font-bold">
                {user.role}
              </span>
            </div>
            
            <Link href="/dashboard" className="p-2 text-gray-500 hover:text-emerald-600 transition">
              <LayoutDashboard size={20} />
            </Link>
            
            <button 
              onClick={logout}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold transition"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <div className="flex gap-3">
             {/* These buttons trigger the AuthModal in page.tsx */}
          </div>
        )}
      </div>
    </nav>
  );
}