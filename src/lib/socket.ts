import { io } from 'socket.io-client';
import { useStore } from '@/store';
import { OrderTime, WorkSession } from '@/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://192.168.0.37:3001';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.0.37:3001';

export const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

// Basic socket event handlers
socket.on('connect', () => {
  console.log('Socket.IO Connected');
});

socket.on('disconnect', () => {
  console.log('Socket.IO Disconnected');
});

socket.on('connect_error', (error) => {
  console.error('Socket.IO Connection Error:', error);
});

// Function to fetch orders from MongoDB
const fetchOrders = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const orders = await response.json();
    useStore.setState((state) => ({ 
      ...state,
      orders: orders || [] 
    }));
  } catch (error) {
    console.error('Error fetching orders:', error);
    useStore.setState((state) => ({ ...state, orders: [] }));
  }
};

// Function to fetch sessions from MongoDB
const fetchSessions = async () => {
  try {
    console.log('\n=== Fetching Sessions from Client ===');
    const response = await fetch(`/api/sessions`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const sessionsData = await response.json();
    console.log('📥 Received sessions data:', sessionsData);
    
    useStore.setState((state) => {
      const orderTimes = { ...state.rangeTimer.orderTimes };

      if (Array.isArray(sessionsData)) {
        sessionsData.forEach((sessionItem) => {
          const { orderId, session } = sessionItem;
          console.log(`\nProcessing session for order ${orderId}:`, session);
          
          if (!orderId || !session) return;

          if (!orderTimes[orderId]) {
            orderTimes[orderId] = {
              totalSeconds: 0,
              currentSessionSeconds: 0,
              lastActiveDate: session.startTime,
              isActive: false,
              employeeName: session.employeeName,
              sessions: [],
              lastUpdate: Date.now()
            };
          }

          // Check if session already exists
          const sessionExists = orderTimes[orderId].sessions.some(
            s => s.startTime === session.startTime && s.employeeName === session.employeeName
          );

          if (!sessionExists) {
            console.log(`Adding new session to order ${orderId}:`, session);
            orderTimes[orderId].sessions = [...(orderTimes[orderId].sessions || []), session];
            if (session.duration) {
              orderTimes[orderId].totalSeconds = (orderTimes[orderId].totalSeconds || 0) + session.duration;
            }
          }
        });
      }

      console.log('📊 Final orderTimes state:', orderTimes);
      
      return {
        ...state,
        rangeTimer: {
          ...state.rangeTimer,
          orderTimes,
        },
      };
    });
  } catch (error) {
    console.error('❌ Error fetching sessions:', error);
  }
};

// Initialize socket event handlers
socket.on('orderCreated', () => {
  console.log('Socket.IO: New order received, fetching orders...');
  fetchOrders();
});

// Handle order status updates
socket.on('orderStatusUpdate', (data) => {
  console.log('Socket.IO: Order status update received:', data);
  const { orderId, isActive, employeeName, startTime } = data;
  
  useStore.setState((state) => {
    const currentTime = new Date().toISOString();
    const orderTimes = { ...state.rangeTimer.orderTimes };
    const orderTime = orderTimes[orderId] || {
      totalSeconds: 0,
      currentSessionSeconds: 0,
      isActive: false,
      sessions: [],
      lastUpdate: Date.now(),
      employeeName: '',
      lastActiveDate: currentTime
    };

    // Update active status and employee name
    orderTime.isActive = isActive;
    orderTime.employeeName = isActive ? employeeName : '';
    
    if (isActive) {
      orderTime.lastActiveDate = startTime || currentTime;
      orderTime.currentSessionSeconds = 0;
      orderTime.lastUpdate = Date.now();
    } else {
      // When becoming inactive, clear the current session
      orderTime.currentSessionSeconds = 0;
      orderTime.lastUpdate = Date.now();
    }

    return {
      ...state,
      rangeTimer: {
        ...state.rangeTimer,
        orderTimes: {
          ...orderTimes,
          [orderId]: orderTime,
        },
      },
    };
  });
});

// Handle session updates
socket.on('sessionUpdated', (data) => {
  console.log('Socket.IO: Session update received:', data);
  const { orderId, session } = data;
  
  useStore.setState((state) => {
    const orderTimes = { ...state.rangeTimer.orderTimes };
    const orderTime = orderTimes[orderId] || {
      totalSeconds: 0,
      currentSessionSeconds: 0,
      isActive: false,
      sessions: [],
      lastUpdate: Date.now(),
      employeeName: session.employeeName,
      lastActiveDate: session.startTime
    };

    // Check if session already exists
    const sessionExists = orderTime.sessions.some(
      s => s.startTime === session.startTime && s.employeeName === session.employeeName
    );

    if (!sessionExists) {
      console.log(`Adding new session update for order ${orderId}:`, session);
      orderTime.sessions = [...orderTime.sessions, session];
      if (session.duration) {
        orderTime.totalSeconds += session.duration;
      }
    }

    orderTimes[orderId] = orderTime;

    return {
      ...state,
      rangeTimer: {
        ...state.rangeTimer,
        orderTimes,
      },
    };
  });
});

// Initial data fetch
fetchOrders();
fetchSessions();

export default socket; 