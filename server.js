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
      allowedHeaders: ["Content-Type", "Authorization"],
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

  // API Routes
  server.get('/api/orders', async (req, res) => {
    try {
      const orders = await Order.find().sort({ createdAt: -1 });
      res.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  server.post('/api/orders', async (req, res) => {
    try {
      const { type, description, status, startDate, dueDate } = req.body;
      
      // Generate random order number between 1000 and 9999
      const orderNumber = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Create order
      const order = await Order.create({
        number: orderNumber,
        type,
        description,
        status,
        startDate: new Date(startDate),
        dueDate: new Date(dueDate),
        sessions: []
      });

      // Emit to all clients
      io.emit('orderCreated', order);

      res.status(201).json(order);
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
    console.log(`> Ready on http://localhost:${PORT}`);
  });
}); 