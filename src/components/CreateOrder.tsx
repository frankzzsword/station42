import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, addDays } from 'date-fns';
import {
  DocumentPlusIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  XMarkIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

const orderTypes = [
  { value: 'Process technology for beer', label: 'Process technology for beer' },
  { value: 'Filling and capping', label: 'Filling and capping' },
  { value: 'Process technology for juice', label: 'Process technology for juice' },
  { value: 'Maintenance', label: 'Maintenance' },
  { value: 'Quality Control', label: 'Quality Control' },
];

const statusOptions = [
  { value: 'Productive', label: 'Productive', color: 'bg-green-500' },
  { value: 'Rework', label: 'Rework', color: 'bg-yellow-500' },
];

interface CreateOrderProps {
  onClose: () => void;
}

export default function CreateOrder({ onClose }: CreateOrderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    status: 'Productive',
    startDate: new Date(),
    dueDate: addDays(new Date(), 7),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create order');
      onClose();
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-gray-800 rounded-xl border border-gray-700 shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <DocumentPlusIcon className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-xl font-semibold text-white">Create New Order</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Order Type
            </label>
            <div className="relative">
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                required
              >
                <option value="" disabled>Select type</option>
                {orderTypes.map((type) => (
                  <option key={type.value} value={type.value} className="py-2">
                    {type.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Status
            </label>
            <div className="flex gap-4">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, status: option.value })}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    formData.status === option.value
                      ? `border-${option.color} bg-gray-800`
                      : 'border-gray-700 bg-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${option.color}`} />
                    <span className="text-white font-medium">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              required
              placeholder="Enter order description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={format(formData.startDate, 'yyyy-MM-dd')}
                  onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value) })}
                  className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  required
                />
                <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Due Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={format(formData.dueDate, 'yyyy-MM-dd')}
                  onChange={(e) => setFormData({ ...formData, dueDate: new Date(e.target.value) })}
                  min={format(formData.startDate, 'yyyy-MM-dd')}
                  className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  required
                />
                <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-gray-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <ClipboardDocumentListIcon className="w-5 h-5" />
                  Create Order
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
} 