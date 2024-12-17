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

mongoose.connect(process.env.MONGODB_URI, {
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
      origin: ["https://station42.vercel.app", "http://localhost:3000"],
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e8
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
    origin: ["https://station42.vercel.app", "http://localhost:3000"],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));
  server.use(express.json({ limit: '50mb' }));
  server.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check endpoint
  server.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // API Routes
  server.get('/api/orders', async (req, res) => {
    try {
      const orders = await Order.find().sort({ createdAt: -1 });
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ error: 'Internal server error', details: error.message });
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

      // Emit to all connected clients
      io.emit('orderCreated', order.toJSON());

      res.setHeader('Content-Type', 'application/json');
      res.status(201).json(order);
    } catch (error) {
      console.error('Error creating order:', error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // Socket.IO middleware to attach to Express routes
  server.use((req, res, next) => {
    req.io = io;
    next();
  });

  // Error handling middleware
  server.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  });

  // Next.js request handling
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3001;
  httpServer.listen(PORT, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
}); 