import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { WorkOrder, WorkSession, OrderTime } from '@/types';
import { config } from '@/config';

// Create a single socket instance
const socket = io(config.socketUrl, {
  path: '/api/socketio',
  transports: ['websocket'] as string[],
  secure: true,
  rejectUnauthorized: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: true
});

interface Store {
  orders: WorkOrder[];
  rangeTimer: {
    orderTimes: {
      [key: string]: OrderTime;
    };
  };
  socket: Socket | null;
  setOrders: (orders: WorkOrder[]) => void;
  addOrder: (order: WorkOrder) => void;
  updateOrderTime: (orderId: string, orderTime: OrderTime) => void;
  updateOrderStatus: (orderId: string, employeeName: string, isActive: boolean) => void;
  initializeSocket: () => void;
  initializeStore: () => Promise<void>;
}

const useStore = create<Store>((set, get) => {
  // Set up interval for updating current session times
  let intervalId: NodeJS.Timeout | null = null;

  if (typeof window !== 'undefined') {
    // Clear any existing interval
    if (intervalId) {
      clearInterval(intervalId);
    }
    
    // Set up new interval with 1-second updates
    intervalId = setInterval(() => {
      set((state) => {
        const now = Date.now();
        const updatedOrderTimes = { ...state.rangeTimer.orderTimes };
        let hasUpdates = false;

        Object.entries(updatedOrderTimes).forEach(([orderId, orderTime]) => {
          if (orderTime.isActive && orderTime.lastUpdate) {
            const timeDiff = Math.floor((now - orderTime.lastUpdate) / 1000);
            if (timeDiff >= 1) {
              updatedOrderTimes[orderId] = {
                ...orderTime,
                currentSessionSeconds: orderTime.currentSessionSeconds + 1,
                totalSeconds: orderTime.totalSeconds + 1,
                lastUpdate: now,
              };
              hasUpdates = true;
            }
          }
        });

        return hasUpdates ? {
          ...state,
          rangeTimer: {
            ...state.rangeTimer,
            orderTimes: updatedOrderTimes,
          },
        } : state;
      });
    }, 1000);
  }

  return {
    orders: [],
    rangeTimer: {
      orderTimes: {},
    },
    socket: null,

    initializeStore: async () => {
      console.log('Initializing store...');
      try {
        // Fetch initial orders
        const response = await fetch(config.api.orders);
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        const orders = await response.json();
        console.log('Fetched initial orders:', orders);
        
        // Initialize socket connection
        get().initializeSocket();
        
        // Set initial orders
        get().setOrders(orders);
        
        console.log('Store initialized successfully');
      } catch (error) {
        console.error('Error initializing store:', error);
      }
    },

    setOrders: (orders) => {
      console.log('Setting orders:', orders);
      const orderTimes: { [key: string]: OrderTime } = {};
      orders.forEach(order => {
        const activeSessions = order.activeSessions || [];
        const isActive = activeSessions.length > 0;
        const currentSession = isActive ? activeSessions[0] : null;

        orderTimes[order.number] = {
          totalSeconds: (order.sessions || []).reduce((total, session) => {
            return total + (session.duration || 0);
          }, 0),
          currentSessionSeconds: currentSession ? 
            Math.floor((Date.now() - new Date(currentSession.startTime).getTime()) / 1000) : 0,
          lastActiveDate: currentSession ? new Date(currentSession.startTime).toISOString() : new Date().toISOString(),
          isActive: isActive,
          employeeName: currentSession?.employeeName || '',
          sessions: order.sessions || [],
          lastUpdate: Date.now(),
        };
      });

      set({
        orders,
        rangeTimer: {
          orderTimes,
        },
      });
    },

    addOrder: (order) => set((state) => {
      const orderTimes = {
        ...state.rangeTimer.orderTimes,
        [order.number]: {
          totalSeconds: 0,
          currentSessionSeconds: 0,
          lastActiveDate: new Date().toISOString(),
          isActive: false,
          employeeName: '',
          sessions: [],
          lastUpdate: Date.now(),
        },
      };

      return {
        orders: [order, ...state.orders],
        rangeTimer: {
          ...state.rangeTimer,
          orderTimes,
        },
      };
    }),

    updateOrderTime: (orderId, orderTime) => {
      set((state) => {
        const order = state.orders.find(o => o.id === orderId || o.number === orderId);
        if (!order) {
          console.warn('Order not found:', orderId);
          return state;
        }

        const updatedOrderTimes = {
          ...state.rangeTimer.orderTimes,
          [order.number]: {
            ...orderTime,
            lastUpdate: Date.now(),
          },
        };

        const updatedOrders = state.orders.map(o => {
          if (o.id === orderId || o.number === orderId) {
            return {
              ...o,
              activeSessions: orderTime.isActive ? [{
                employeeName: orderTime.employeeName,
                startTime: orderTime.lastActiveDate,
                duration: orderTime.currentSessionSeconds,
                isActive: true
              }] : [],
              sessions: [...(orderTime.sessions || [])]
            };
          }
          return o;
        });

        return {
          ...state,
          orders: updatedOrders,
          rangeTimer: {
            ...state.rangeTimer,
            orderTimes: updatedOrderTimes,
          },
        };
      });
    },

    updateOrderStatus: (orderId, employeeName, isActive) => {
      set((state) => {
        const currentTime = new Date().toISOString();
        const now = Date.now();
        const order = state.orders.find(o => o.id === orderId || o.number === orderId);
        
        if (!order) {
          console.warn('Order not found:', orderId);
          return state;
        }

        const currentOrderTime = state.rangeTimer.orderTimes[order.number] || {
          totalSeconds: 0,
          currentSessionSeconds: 0,
          lastActiveDate: currentTime,
          isActive: false,
          employeeName: '',
          sessions: [],
          lastUpdate: now,
        };

        const updatedOrderTime = { ...currentOrderTime };

        if (isActive && !currentOrderTime.isActive) {
          const newSession = {
            employeeName,
            startTime: currentTime,
            duration: 0,
            isActive: true
          };
          updatedOrderTime.sessions = [...(currentOrderTime.sessions || []), newSession];
          updatedOrderTime.isActive = true;
          updatedOrderTime.employeeName = employeeName;
          updatedOrderTime.lastActiveDate = currentTime;
          updatedOrderTime.lastUpdate = now;
          updatedOrderTime.currentSessionSeconds = 0;
        } else if (!isActive && currentOrderTime.isActive) {
          const sessions = [...currentOrderTime.sessions];
          const currentSession = sessions[sessions.length - 1];
          if (currentSession && !currentSession.endTime) {
            const updatedSession = {
              ...currentSession,
              endTime: currentTime,
              isActive: false,
              duration: Math.floor(
                (now - new Date(currentSession.startTime).getTime()) / 1000
              )
            };
            sessions[sessions.length - 1] = updatedSession;
            updatedOrderTime.sessions = sessions;
            updatedOrderTime.totalSeconds += updatedSession.duration;
          }
          updatedOrderTime.isActive = false;
          updatedOrderTime.employeeName = '';
          updatedOrderTime.currentSessionSeconds = 0;
        }

        const updatedOrders = state.orders.map((o) =>
          o.id === orderId || o.number === orderId
            ? { 
                ...o,
                sessions: updatedOrderTime.sessions,
                activeSessions: isActive ? [{
                  employeeName,
                  startTime: currentTime,
                  duration: 0,
                  isActive: true
                }] : []
              }
            : o
        );

        return {
          ...state,
          orders: updatedOrders,
          rangeTimer: {
            ...state.rangeTimer,
            orderTimes: {
              ...state.rangeTimer.orderTimes,
              [order.number]: updatedOrderTime,
            },
          },
        };
      });
    },

    initializeSocket: () => {
      socket.removeAllListeners();
      
      socket.on('orderTimeUpdate', (data: { orderId: string; orderTime: OrderTime }) => {
        console.log('Received orderTimeUpdate:', data);
        get().updateOrderTime(data.orderId, data.orderTime);
      });

      socket.on('orderStatusUpdate', (data: { orderId: string; employeeName: string; isActive: boolean }) => {
        console.log('Received orderStatusUpdate:', data);
        get().updateOrderStatus(data.orderId, data.employeeName, data.isActive);
      });

      socket.on('ordersUpdate', (orders: WorkOrder[]) => {
        console.log('Received ordersUpdate:', orders);
        get().setOrders(orders);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      set({ socket });
    },
  };
});

// Cleanup function
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    socket.disconnect();
  });
}

export { useStore }; 