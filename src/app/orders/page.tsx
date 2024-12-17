'use client';

import { useEffect } from 'react';
import OrdersOverview from '@/components/OrdersOverview';
import Sidebar from '@/components/Sidebar';
import '@/lib/socket';

export default function OrdersPage() {
  return (
    <main className="flex min-h-screen bg-gray-900">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <OrdersOverview />
        </div>
      </div>
    </main>
  );
} 