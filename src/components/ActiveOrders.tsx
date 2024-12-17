import React, { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  BoltIcon,
  ClockIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
};

export default function ActiveOrders() {
  const { orders, rangeTimer } = useStore();
  const [, setTick] = useState(0); // Force re-render every second

  console.log('ActiveOrders Debug:', {
    orders: orders.map(o => ({ id: o.id, number: o.number })),
    orderTimes: Object.keys(rangeTimer.orderTimes)
  });

  // Force component update every second to show current time
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeOrders = orders.filter((order) => {
    const orderTime = rangeTimer.orderTimes[order.number];
    console.log('Checking active order:', {
      number: order.number,
      hasOrderTime: !!orderTime,
      isActive: orderTime?.isActive
    });
    return orderTime?.isActive;
  });

  console.log('Active orders found:', activeOrders.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-green-500/10">
          <BoltIcon className="w-5 h-5 text-green-500" />
        </div>
        <h2 className="text-xl font-semibold text-white">Active Orders</h2>
      </div>

      <div className="grid gap-4">
        {activeOrders.map((order, index) => {
          const orderTime = rangeTimer.orderTimes[order.number];
          const currentSession = orderTime?.sessions[orderTime.sessions.length - 1];
          const totalTime = orderTime.totalSeconds + orderTime.currentSessionSeconds;
          
          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative overflow-hidden bg-gray-800 rounded-xl border border-gray-700"
            >
              {/* Glowing effect for active orders */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-transparent animate-pulse" />
              
              <div className="relative p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-white">
                        Order #{order.number}
                      </h3>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-900/50 text-green-400">
                        Active
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{order.type}</p>
                    <p className="mt-2 text-sm text-gray-300 line-clamp-2">
                      {order.description}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="text-2xl font-mono font-bold text-white">
                      {formatDuration(totalTime)}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">Total Time</p>
                  </div>
                </div>

                {currentSession && (
                  <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-gray-900/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-900/50">
                        <UserCircleIcon className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-200">
                          {currentSession.employeeName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <ClockIcon className="w-4 h-4 text-gray-500" />
                          <p className="text-sm text-gray-400">
                            Started at {format(new Date(currentSession.startTime), "HH:mm:ss")}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-medium text-green-400">
                        In Progress
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {activeOrders.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700"
          >
            <BoltIcon className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No active orders at the moment</p>
          </motion.div>
        )}
      </div>
    </div>
  );
} 