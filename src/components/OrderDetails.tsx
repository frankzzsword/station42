import React, { useMemo } from 'react';
import { useStore } from '@/store';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  ClockIcon,
  CalendarIcon,
  UserCircleIcon,
  DocumentTextIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import SessionHistory from './SessionHistory';

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

interface OrderDetailsProps {
  orderId: string;
}

export default function OrderDetails({ orderId }: OrderDetailsProps) {
  const { orders, rangeTimer } = useStore();
  
  const order = orders.find(o => o.id === orderId || o.number === orderId);
  const orderTime = order ? rangeTimer.orderTimes[order.number] : null;

  // Early return if no order found
  if (!order) {
    console.log('No order found for:', orderId);
    return (
      <div className="bg-gray-800 rounded-xl p-6 text-center text-gray-400">
        Order not found
      </div>
    );
  }

  // Simplify active check to just check orderTime.isActive
  const isActive = orderTime?.isActive || false;

  // Calculate total time from both sources
  const totalSeconds = useMemo(() => {
    let total = 0;
    
    // Add completed sessions from MongoDB
    if (order.sessions) {
      total += order.sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    }
    
    // Add sessions from rangeTimer
    if (orderTime?.sessions) {
      total += orderTime.sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    }
    
    // Add current session time if active
    if (isActive && orderTime?.currentSessionSeconds) {
      total += orderTime.currentSessionSeconds;
    }
    
    return total;
  }, [order.sessions, orderTime, isActive]);

  // Get current employee name
  const currentEmployee = orderTime?.employeeName || null;

  // Calculate timeline from dates
  const timeline = useMemo(() => {
    try {
      if (!order.startDate || !order.dueDate) return 'Not Set';
      const start = format(new Date(order.startDate), 'MMM d');
      const due = format(new Date(order.dueDate), 'MMM d');
      return `${start} - ${due}`;
    } catch (error) {
      return 'Not Set';
    }
  }, [order.startDate, order.dueDate]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
      >
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">
                  Order #{order.number}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  order.status === 'Productive' 
                    ? 'bg-green-900/50 text-green-400'
                    : 'bg-yellow-900/50 text-yellow-400'
                }`}>
                  {order.status}
                </span>
              </div>
              <p className="text-gray-400">{order.type || 'No Type'}</p>
            </div>

            {isActive && (
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-900/20 border border-green-900/50">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium text-green-400">Currently Active</span>
                </div>
                {currentEmployee && (
                  <div className="text-sm text-gray-400">
                    Working: {currentEmployee}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-900/50">
                  <ClockIcon className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-sm font-medium text-gray-400">Total Time</span>
              </div>
              <p className="text-2xl font-mono font-bold text-white">
                {formatDuration(totalSeconds)}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-purple-900/50">
                  <UserCircleIcon className="h-5 w-5 text-purple-400" />
                </div>
                <span className="text-sm font-medium text-gray-400">Sessions</span>
              </div>
              <p className="text-2xl font-mono font-bold text-white">
                {((order.sessions?.length || 0) + (orderTime?.sessions?.length || 0))}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-yellow-900/50">
                  <CalendarIcon className="h-5 h-5 text-yellow-400" />
                </div>
                <span className="text-sm font-medium text-gray-400">Timeline</span>
              </div>
              <p className="text-sm font-medium text-white">
                {timeline}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Description */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800 rounded-xl border border-gray-700 p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gray-900/50">
            <DocumentTextIcon className="w-5 h-5 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Description</h2>
        </div>
        <p className="text-gray-300 whitespace-pre-wrap">
          {order.description || 'No description available'}
        </p>
      </motion.div>

      {/* Session History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-900/50">
            <ChartBarIcon className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Session History</h2>
        </div>
        <SessionHistory orderId={order.number} />
      </motion.div>
    </div>
  );
} 