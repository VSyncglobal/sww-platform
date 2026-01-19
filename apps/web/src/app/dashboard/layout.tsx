import DashboardSidebar from '@/components/DashboardSidebar';
import MobileNav from '@/components/MobileNav'; // This will now work
import Navbar from '@/components/Navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />
      
      <div className="flex pt-4 pb-24 lg:pb-4">
        {/* Sidebar (Hidden on mobile) */}
        <DashboardSidebar />

        {/* Mobile Navigation (Visible on mobile) */}
        <MobileNav />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-4 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}