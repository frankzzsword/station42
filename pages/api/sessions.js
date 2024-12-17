const mongoose = require('mongoose');
const Order = require('../../models/Order');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      console.log('\n=== Fetching Sessions ===');
      const orders = await Order.find({ 'sessions.0': { $exists: true } });
      console.log('Found orders with sessions:', orders.length);
      
      const sessions = [];
      orders.forEach(order => {
        order.sessions.forEach(session => {
          sessions.push({
            orderId: order._id.toString(),
            session: {
              startTime: session.startTime.toISOString(),
              endTime: session.endTime.toISOString(),
              employeeName: session.employeeName,
              duration: session.duration
            }
          });
        });
      });

      res.status(200).json(sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  } else if (req.method === 'POST') {
    try {
      const { orderId, session } = req.body;
      console.log('\n=== Received Session POST ===');
      console.log('Order ID:', orderId);
      console.log('Session:', session);

      // Find order by MongoDB _id
      const order = await Order.findById(orderId);
      if (!order) {
        console.log('Order not found:', orderId);
        return res.status(404).json({ error: 'Order not found' });
      }

      // Create session object
      const newSession = {
        employeeName: session.employeeName,
        startTime: new Date(session.startTime),
        endTime: new Date(session.endTime),
        duration: session.duration
      };

      // Add session to order
      order.sessions = order.sessions || [];
      order.sessions.push(newSession);

      // Save order
      await order.save();
      console.log('Session saved successfully');
      res.status(200).json({ message: 'Session saved successfully' });
    } catch (error) {
      console.error('Error saving session:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 