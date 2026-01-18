import AdminSidebar from '@/components/AdminSidebar'; // Ensure this component exists

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 1. Fixed Sidebar */}
      <AdminSidebar />
      
      {/* 2. Main Content Area (Offset by 256px/16rem to clear sidebar) */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}