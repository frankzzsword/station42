import React, { useMemo } from 'react';
import { useStore } from '@/store';
import { format } from 'date-fns';
import { ClockIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { WorkSession } from '@/types';

interface OrderSession extends WorkSession {
  orderNumber: string;
  orderType: string;
}

interface EmployeeGroup {
  employeeName: string;
  orders: {
    orderNumber: string;
    orderType: string;
    sessions: OrderSession[];
  }[];
}

interface DailyGroup {
  date: string;
  employees: EmployeeGroup[];
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

function formatTimeRange(startTime: string | Date, endTime?: string | Date | null): string {
  const start = format(new Date(startTime), "HH:mm");
  if (!endTime) return `${start} - In Progress`;
  try {
    const end = format(new Date(endTime), "HH:mm");
    return `${start} - ${end}`;
  } catch (error) {
    return `${start} - Invalid End Time`;
  }
}

export default function SessionHistory() {
  const { orders } = useStore();

  // Process all sessions across all orders, grouped by date and employee
  const dailyGroups = useMemo(() => {
    const groups: Record<string, DailyGroup> = {};

    orders.forEach(order => {
      const allSessions = order.sessions || [];

      if (!allSessions.length) return;

      allSessions
        .filter(session => 
          session.startTime && 
          session.employeeName &&
          session.duration > 0  // Only include sessions with positive duration
        )
        .forEach(session => {
          const date = format(new Date(session.startTime), 'yyyy-MM-dd');
          if (!groups[date]) {
            groups[date] = {
              date,
              employees: []
            };
          }

          const orderSession: OrderSession = {
            ...session,
            orderNumber: order.number,
            orderType: order.type
          };

          let employeeGroup = groups[date].employees.find(e => e.employeeName === session.employeeName);
          if (!employeeGroup) {
            employeeGroup = {
              employeeName: session.employeeName,
              orders: []
            };
            groups[date].employees.push(employeeGroup);
          }

          let orderGroup = employeeGroup.orders.find(o => o.orderNumber === order.number);
          if (!orderGroup) {
            orderGroup = {
              orderNumber: order.number,
              orderType: order.type,
              sessions: []
            };
            employeeGroup.orders.push(orderGroup);
          }

          orderGroup.sessions.push(orderSession);
        });
    });

    // Sort sessions within each order by date (newest first)
    Object.values(groups).forEach(group => {
      group.employees.forEach(employee => {
        employee.orders.forEach(order => {
          order.sessions.sort((a, b) => 
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
          );
        });
      });
    });

    // Convert to array and sort by date (newest first)
    return Object.values(groups).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [orders]);

  if (orders.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 text-center text-gray-400">
        <div className="animate-pulse">Loading sessions...</div>
      </div>
    );
  }

  if (dailyGroups.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 text-center text-gray-400">
        No sessions recorded yet
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {dailyGroups.map((group) => (
        <motion.div
          key={group.date}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
        >
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-900/50">
                <ClockIcon className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="font-medium text-gray-200">
                {format(new Date(group.date), 'MMMM d, yyyy')}
              </h3>
            </div>
          </div>
          
          <div className="divide-y divide-gray-700">
            {group.employees.map((employee) => (
              <div key={employee.employeeName} className="p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-4">
                  <UserCircleIcon className="h-5 w-5" />
                  <span className="font-medium">{employee.employeeName}</span>
                </div>
                
                <div className="space-y-4 pl-4">
                  {employee.orders.map((order) => (
                    <div key={order.orderNumber} className="space-y-2">
                      <div className="font-medium text-gray-300">
                        Order #{order.orderNumber} - {order.orderType}
                      </div>
                      
                      <div className="space-y-2 pl-6 border-l-2 border-gray-700">
                        {order.sessions.map((session, index) => (
                          <div
                            key={`${session.startTime}-${index}`}
                            className="flex items-center justify-between p-2 rounded bg-gray-700/30"
                          >
                            <div className="space-y-1">
                              <div className="text-sm text-blue-400">
                                {formatTimeRange(session.startTime, session.endTime)}
                              </div>
                              <div className="text-xs text-gray-400">
                                Duration: {formatDuration(session.duration)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
} 