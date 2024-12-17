require('dotenv').config({ path: '.env.local' });
const express = require('express');
const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// MongoDB Models
const Order = require('./models/Order');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);
  
  // Socket.IO setup with enhanced configuration
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.VERCEL_URL ? 
        [`https://${process.env.VERCEL_URL}`, 'https://station42.vercel.app'] : 
        ['http://localhost:3000'],
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    path: '/api/socketio',
  });

  // Socket.IO error handling
  io.on('connect', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('Client disconnected:', socket.id, 'Reason:', reason);
    });
  });

  // Express middleware
  server.use(cors({
    origin: process.env.VERCEL_URL ? 
      [`https://${process.env.VERCEL_URL}`, 'https://station42.vercel.app'] : 
      ['http://localhost:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true
  }));
  
  server.use(express.json());

  // API Routes with better error handling
  server.get('/api/orders', async (req, res) => {
    try {
      const orders = await Order.find().sort({ createdAt: -1 }).lean();
      res.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  server.post('/api/orders', async (req, res) => {
    try {
      const { type, description, status, startDate, dueDate } = req.body;
      
      if (!type || !description || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const orderNumber = Math.floor(1000 + Math.random() * 9000).toString();
      
      const order = await Order.create({
        number: orderNumber,
        type,
        description,
        status,
        startDate: new Date(startDate),
        dueDate: new Date(dueDate),
        sessions: []
      });

      io.emit('orderCreated', order.toJSON());
      res.status(201).json(order);
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  // Socket.IO middleware
  server.use((req, res, next) => {
    req.io = io;
    next();
  });

  // Next.js request handling
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3001;
  httpServer.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on port ${PORT}`);
  });
}); 