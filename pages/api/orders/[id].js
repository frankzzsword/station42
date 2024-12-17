import mongoose from 'mongoose';
const Order = mongoose.models.Order || require('../../../models/Order');

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      console.log('\n=== Fetching Order Details ===');
      console.log('Order ID:', id);

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid order ID format' });
      }

      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      console.log('Found order:', order.number);
      res.status(200).json(order);
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ error: 'Failed to fetch order details' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 