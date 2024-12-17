import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  switch (req.method) {
    case 'GET':
      try {
        const orders = await Order.find({}).sort({ createdAt: -1 });
        res.status(200).json(orders);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
      }
      break;

    case 'POST':
      try {
        const { number, type, description } = req.body;
        
        // Generate order number if not provided
        const orderNumber = number || `ORD${Date.now().toString().slice(-6)}`;
        
        const order = await Order.create({
          number: orderNumber,
          type,
          description,
          status: 'pending',
        });

        // Emit the new order to all connected clients via Socket.IO
        const io = (req as any).io;
        if (io) {
          io.emit('orderCreated', order);
        }

        res.status(201).json(order);
      } catch (error) {
        res.status(500).json({ error: 'Failed to create order' });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
} 