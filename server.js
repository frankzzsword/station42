require('dotenv').config({ path: '.env.local' });
const express = require('express');
const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const os = require('os');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Get local IP addresses
const getLocalIPs = () => {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const k in interfaces) {
    for (const k2 in interfaces[k]) {
      const address = interfaces[k][k2];
      if (address.family === 'IPv4' && !address.internal) {
        addresses.push(address.address);
      }
    }
  }
  return addresses;
};

// MongoDB Models
const Order = require('./models/Order');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
  });

  server.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true
  }));
  server.use(express.json());

  // Helper function to calculate session duration
  function calculateSessionDuration(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000);
    return duration > 0 ? duration : 0; // Ensure duration is never negative
  }

  // Helper function to calculate due status
  function calculateDueStatus(dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get start of current week (Monday)
    const thisWeekStart = new Date(today);
    const daysSinceMonday = (today.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
    thisWeekStart.setDate(today.getDate() - daysSinceMonday);
    thisWeekStart.setHours(0, 0, 0, 0);
    
    // Get end of current week (Sunday)
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
    thisWeekEnd.setHours(23, 59, 59, 999);
    
    // Get start of next week
    const nextWeekStart = new Date(thisWeekEnd);
    nextWeekStart.setDate(thisWeekEnd.getDate() + 1);
    nextWeekStart.setHours(0, 0, 0, 0);
    
    // Get end of next week
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
    nextWeekEnd.setHours(23, 59, 59, 999);

    // Convert dueDate to Date object if it's a string
    const dueDateObj = new Date(dueDate);
    dueDateObj.setHours(0, 0, 0, 0);

    // If due date is before today, it's overdue
    if (dueDateObj < today) {
      return 'Overdue';
    }
    
    // If due date is this week (including today)
    if (dueDateObj >= today && dueDateObj <= thisWeekEnd) {
      return 'Due Now';
    }
    
    // If due date is next week
    if (dueDateObj > thisWeekEnd && dueDateObj <= nextWeekEnd) {
      return 'Due Soon';
    }
    
    // If due date is beyond next week
    return 'Due Later';
  }

  // Helper function to generate unique random order number
  async function generateUniqueOrderNumber() {
    let isUnique = false;
    let orderNumber;
    
    while (!isUnique) {
      // Generate random number between 1000 and 9999
      orderNumber = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Check if number exists in database
      const existingOrder = await Order.findOne({ number: orderNumber });
      if (!existingOrder) {
        isUnique = true;
      }
    }
    
    return orderNumber;
  }

  // API Routes
  server.get('/api/orders', async (req, res) => {
    try {
      const orders = await Order.find().sort({ createdAt: -1 });
      
      // Update due status for each order
      const updatedOrders = orders.map(order => {
        const dueStatus = calculateDueStatus(order.dueDate);
        if (order.dueStatus !== dueStatus) {
          order.dueStatus = dueStatus;
          order.save(); // Save in background
        }
        return order;
      });

      res.json(updatedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  server.post('/api/orders', async (req, res) => {
    try {
      const { type, description, status, startDate, dueDate } = req.body;
      
      // Generate unique random order number
      const orderNumber = await generateUniqueOrderNumber();
      
      // Parse and validate dates
      const validStartDate = new Date(startDate);
      const validDueDate = new Date(dueDate);
      
      if (isNaN(validStartDate.getTime()) || isNaN(validDueDate.getTime())) {
        throw new Error('Invalid dates provided');
      }
      
      // Calculate initial due status
      const dueStatus = calculateDueStatus(validDueDate);
      
      // Create order with status exactly as provided
      const order = await Order.create({
        number: orderNumber,
        type,
        description: description.split('\n').map(line => 
          line.trim().startsWith('- ') ? 
          `**${line.substring(2)}**` : 
          line
        ).join('\n'),
        status: status,
        dueStatus,
        startDate: validStartDate,
        dueDate: validDueDate,
        sessions: [],
        activeSessions: []
      });

      // Format the order response
      const formattedOrder = {
        id: order._id.toString(),
        number: order.number,
        type: order.type,
        status: order.status,
        description: order.description,
        dueStatus: dueStatus,
        dueDate: order.dueDate.toISOString(),
        startDate: order.startDate.toISOString(),
        sessions: [],
        activeSessions: []
      };

      // Broadcast new order to all clients
      io.emit('ordersUpdate', [formattedOrder]);

      res.status(201).json(formattedOrder);
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Next.js request handling
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3001;
  httpServer.listen(PORT, '0.0.0.0', (err) => {
    if (err) throw err;
    const localIPs = getLocalIPs();
    console.log('\nServer is running on:');
    console.log(`> Local:   http://localhost:${PORT}`);
    localIPs.forEach(ip => {
      console.log(`> Network: http://${ip}:${PORT}`);
    });
  });
}); 