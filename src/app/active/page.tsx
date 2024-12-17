'use client';

import { useEffect } from 'react';
import { Card, Title, Text } from '@tremor/react';
import { useStore } from '@/store';
import { format } from 'date-fns';
import Sidebar from '@/components/Sidebar';
import ActiveOrders from '@/components/ActiveOrders';
import '@/lib/socket';

export default function ActiveOrdersPage() {
  const { setOrders } = useStore();

  useEffect(() => {
    // Load initial orders
    const loadOrders = async () => {
      try {
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error('Error loading orders:', error);
      }
    };

    loadOrders();
  }, [setOrders]);

  return (
    <main className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <Title>Active Orders</Title>
            <Text className="text-gray-500 mt-1">
              {format(new Date(), "EEEE, MMMM d")}
            </Text>
          </div>

          <ActiveOrders />
        </div>
      </div>
    </main>
  );
} 