'use client';

import React from 'react';
import { useStore } from '@/store';
import Sidebar from '@/components/Sidebar';
import SessionHistory from '@/components/SessionHistory';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  ClockIcon, 
  BoltIcon, 
  ClipboardDocumentListIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

const MetricCard = ({ title, value, icon: Icon, gradient }: { 
  title: string; 
  value: string; 
  icon: any;
  gradient: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`relative overflow-hidden rounded-xl bg-gray-800 border border-gray-700 p-6 ${gradient}`}
  >
    <div className="flex items-center gap-4">
      <div className="p-3 rounded-xl bg-gray-900/50">
        <Icon className="w-6 h-6 text-gray-100" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-400">{title}</p>
        <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
      </div>
    </div>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5 pointer-events-none" />
  </motion.div>
);

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export default function Home() {
  const { orders, rangeTimer } = useStore();

  console.log('Dashboard Debug:', {
    orders: orders.map(o => ({ id: o.id, number: o.number })),
    orderTimes: Object.keys(rangeTimer.orderTimes)
  });

  // Calculate metrics
  const activeOrders = orders.filter(order => {
    const orderTime = rangeTimer.orderTimes[order.number];
    console.log('Checking active order:', {
      number: order.number,
      hasOrderTime: !!orderTime,
      isActive: orderTime?.isActive
    });
    return orderTime?.isActive;
  });

  const today = new Date();
  const ordersToday = orders.filter(order => {
    const orderTime = rangeTimer.orderTimes[order.number];
    if (!orderTime?.sessions?.length) return false;
    return orderTime.sessions.some(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate.toDateString() === today.toDateString();
    });
  });

  const totalTime = Object.values(rangeTimer.orderTimes).reduce((total, orderTime) => {
    return total + orderTime.totalSeconds + (orderTime.isActive ? orderTime.currentSessionSeconds : 0);
  }, 0);

  // Get recent orders with sessions
  const recentOrdersWithSessions = orders
    .filter(order => {
      const orderTime = rangeTimer.orderTimes[order.number];
      console.log('Checking recent order:', {
        number: order.number,
        hasOrderTime: !!orderTime,
        sessions: orderTime?.sessions?.length
      });
      return orderTime?.sessions?.length > 0;
    })
    .slice(0, 3);

  console.log('Dashboard metrics:', {
    activeOrders: activeOrders.length,
    ordersToday: ordersToday.length,
    totalTime,
    recentOrders: recentOrdersWithSessions.length
  });

  return (
    <main className="flex min-h-screen bg-gray-900">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold text-white"
              >
                Dashboard
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-gray-400 mt-2"
              >
                {format(new Date(), "EEEE, MMMM d")}
              </motion.p>
            </div>
            <Link 
              href="/orders"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white font-medium"
            >
              View Orders
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Active Orders"
              value={activeOrders.length.toString()}
              icon={BoltIcon}
              gradient="from-green-600/10 via-transparent"
            />
            <MetricCard
              title="Orders Today"
              value={ordersToday.length.toString()}
              icon={ClipboardDocumentListIcon}
              gradient="from-blue-600/10 via-transparent"
            />
            <MetricCard
              title="Total Time"
              value={formatTime(totalTime)}
              icon={ClockIcon}
              gradient="from-purple-600/10 via-transparent"
            />
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Recent Sessions</h2>
              <Link 
                href="/sessions"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-gray-200 font-medium border border-gray-700"
              >
                View All Sessions
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>

            {recentOrdersWithSessions.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <SessionHistory orderId={order.number} limit={3} />
              </motion.div>
            ))}

            {recentOrdersWithSessions.length === 0 && (
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
      </div>
    </main>
  );
}
