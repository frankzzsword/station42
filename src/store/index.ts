import { create } from 'zustand';
import { WorkOrder } from '@/types';
import { config } from '@/config';

interface Store {
  orders: WorkOrder[];
  rangeTimer: {
    orderTimes: Record<string, any>;
  };
  setOrders: (orders: WorkOrder[]) => void;
  setRangeTimer: (rangeTimer: any) => void;
  fetchOrders: () => Promise<void>;
}

export const useStore = create<Store>((set) => ({
  orders: [],
  rangeTimer: {
    orderTimes: {},
  },
  setOrders: (orders) => set({ orders }),
  setRangeTimer: (rangeTimer) => set({ rangeTimer }),
  fetchOrders: async () => {
    try {
      const response = await fetch(config.api.orders);
      if (!response.ok) throw new Error('Failed to fetch orders');
      const orders = await response.json();
      set({ orders });
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  },
})); 