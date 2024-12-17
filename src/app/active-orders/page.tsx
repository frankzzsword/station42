'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import ActiveOrders from '@/components/ActiveOrders';

export default function ActiveOrdersPage() {
  return (
    <main className="flex min-h-screen bg-gray-900">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <ActiveOrders />
        </div>
      </div>
    </main>
  );
} 