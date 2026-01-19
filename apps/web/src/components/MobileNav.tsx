'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Banknote, HeartPulse, ArrowLeftRight, Settings } from 'lucide-react';

export default function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { icon: LayoutDashboard, label: 'Home', href: '/dashboard' },
    { icon: Banknote, label: 'Loans', href: '/dashboard/loans' },
    { icon: ArrowLeftRight, label: 'Deposit', href: '/dashboard/deposits' },
    { icon: HeartPulse, label: 'Welfare', href: '/dashboard/welfare' },
    { icon: Settings, label: 'Menu', href: '/dashboard/settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 md:hidden z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center px-2 pb-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${
                isActive ? 'text-sacco-orange bg-orange-50 -translate-y-1' : 'text-slate-400'
              }`}
            >
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold uppercase tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}