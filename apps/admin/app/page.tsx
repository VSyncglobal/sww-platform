'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminGateway() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

    if (token) {
      // 🟢 Authenticated -> Go to Overview
      router.push('/dashboard');
    } else {
      // 🔴 Unauthenticated -> Go to Login
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-900 mx-auto"></div>
        <h2 className="text-xl font-semibold text-gray-700">Accessing Secure Gateway...</h2>
      </div>
    </div>
  );
}