import './globals.css';
import { Inter } from 'next/font/google';
import { AdminAuthProvider } from '@/context/AuthContext'; // Import from created path

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'SWW Admin Console',
  description: 'Governance & Operations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        <AdminAuthProvider>
          {children}
        </AdminAuthProvider>
      </body>
    </html>
  );
}