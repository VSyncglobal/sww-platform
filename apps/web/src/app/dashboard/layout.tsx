import DashboardSidebar from '@/components/DashboardSidebar';
import Navbar from '@/components/Navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="flex pt-4">
        {/* Sidebar (Hidden on mobile, managed via CSS) */}
        <DashboardSidebar />

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-64 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}