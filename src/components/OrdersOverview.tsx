import React, { useState } from 'react';
import { useStore } from '@/store';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  ClipboardDocumentListIcon,
  CalendarIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import CreateOrder from './CreateOrder';

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'Productive':
        return 'bg-green-900/50 text-green-400';
      case 'Rework':
        return 'bg-yellow-900/50 text-yellow-400';
      default:
        return 'bg-gray-900/50 text-gray-400';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyles()}`}>
      {status}
    </span>
  );
};

const DueStatusBadge = ({ status }: { status: string }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'Due Now':
        return 'bg-red-900/50 text-red-400';
      case 'Due Soon':
        return 'bg-yellow-900/50 text-yellow-400';
      case 'Due Later':
        return 'bg-blue-900/50 text-blue-400';
      default:
        return 'bg-gray-900/50 text-gray-400';
    }
  };

  const [prefix, ...rest] = status.split(' ');
  const suffix = rest.join(' ');

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyles()}`}>
      <span className="opacity-70">{prefix}</span> {suffix}
    </span>
  );
};

export default function OrdersOverview() {
  const { orders } = useStore();
  const [showCreateOrder, setShowCreateOrder] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-900/50">
              <ClipboardDocumentListIcon className="w-5 h-5 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Orders</h1>
          </div>
          <button 
            onClick={() => setShowCreateOrder(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white font-medium"
          >
            <PlusIcon className="w-4 h-4" />
            Create Order
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-800/50">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Order #</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Description</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Due Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Timeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {orders.map((order, index) => {
                  const startDate = order.startDate ? format(new Date(order.startDate), 'MMM d') : '';
                  const dueDate = order.dueDate ? format(new Date(order.dueDate), 'MMM d') : '';
                  const timeline = startDate && dueDate ? `${startDate} - ${dueDate}` : '';

                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="text-white font-medium">#{order.number}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300">{order.type}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-300 line-clamp-1 max-w-md">{order.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4">
                        <DueStatusBadge status={order.dueStatus || 'Not Set'} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-400">
                          <CalendarIcon className="w-4 h-4" />
                          <span className="text-sm">{timeline || 'Not Set'}</span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {orders.length === 0 && (
            <div className="text-center py-12">
              <ClipboardDocumentListIcon className="w-12 h-12 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">No orders available</p>
            </div>
          )}
        </div>
      </motion.div>

      {showCreateOrder && (
        <CreateOrder onClose={() => setShowCreateOrder(false)} />
      )}
    </>
  );
} 