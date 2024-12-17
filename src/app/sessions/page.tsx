'use client';

import React from 'react';
import { useStore } from '@/store';
import SessionHistory from '@/components/SessionHistory';
import Sidebar from '@/components/Sidebar';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ClockIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

export default function SessionsPage() {
  const { orders, rangeTimer } = useStore();

  console.log('SessionsPage Debug:', {
    orders: orders.map(o => ({ id: o.id, number: o.number })),
    orderTimes: Object.keys(rangeTimer.orderTimes)
  });

  // Get all orders that have sessions
  const ordersWithSessions = orders.filter(order => {
    const orderTime = rangeTimer.orderTimes[order.number];
    console.log('Checking order:', {
      number: order.number,
      hasOrderTime: !!orderTime,
      sessions: orderTime?.sessions?.length
    });
    return orderTime?.sessions?.length > 0;
  });

  console.log('Orders with sessions:', ordersWithSessions.length);

  // Prepare chart data
  const chartData = ordersWithSessions.map(order => ({
    name: `#${order.number}`,
    duration: rangeTimer.orderTimes[order.number].totalSeconds / 3600,
    status: order.status,
  }));

  return (
    <main className="flex min-h-screen bg-gray-900">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center"
          >
            <div>
              <h1 className="text-3xl font-bold text-white">Session History</h1>
              <div className="flex items-center gap-2 mt-2 text-gray-400">
                <ClockIcon className="h-5 w-5" />
                <span>{format(new Date(), "EEEE, MMMM d, yyyy")}</span>
              </div>
            </div>
          </motion.div>

          {ordersWithSessions.length > 0 ? (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-800 rounded-xl border border-gray-700 p-6"
              >
                <div className="flex items-center gap-2 mb-6">
                  <ChartBarIcon className="h-5 w-5 text-blue-400" />
                  <h2 className="text-lg font-semibold text-white">Time Distribution</h2>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis 
                        dataKey="name" 
                        stroke="#9CA3AF"
                        fontSize={12}
                      />
                      <YAxis 
                        unit="h" 
                        stroke="#9CA3AF"
                        fontSize={12}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '0.5rem',
                        }}
                        labelStyle={{ color: '#F9FAFB' }}
                        itemStyle={{ color: '#D1D5DB' }}
                        formatter={(value: number) => [`${value.toFixed(1)} hours`, 'Duration']}
                      />
                      <Bar
                        dataKey="duration"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <div className="space-y-6">
                {ordersWithSessions.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * (index + 1) }}
                  >
                    <SessionHistory orderId={order.number} />
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700"
            >
              <ClockIcon className="h-12 w-12 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">No session history available</p>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
} 