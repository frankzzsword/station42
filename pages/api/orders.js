const Order = require('../../models/Order');

// Helper function to calculate due status
function calculateDueStatus(dueDate) {
  const today = new Date();
  const thisWeekEnd = new Date(today);
  thisWeekEnd.setDate(today.getDate() + (6 - today.getDay())); // End of this week
  
  const nextWeekEnd = new Date(thisWeekEnd);
  nextWeekEnd.setDate(thisWeekEnd.getDate() + 7); // End of next week
  
  if (dueDate <= thisWeekEnd) {
    return 'Due Now';
  } else if (dueDate <= nextWeekEnd) {
    return 'Due Soon';
  } else {
    return 'Due Later';
  }
}

// Helper function to format date to ISO8601
function formatDateToISO(date) {
  if (!date) return null;
  const isoString = new Date(date).toISOString();
  return isoString.split('.')[0] + 'Z';
}

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      try {
        const orders = await Order.find({}).sort({ createdAt: -1 });
        // Convert to array format that iOS app expects
        const formattedOrders = orders.map(order => {
          const startDate = order.startDate || order.createdAt || new Date();
          const dueDate = order.dueDate || new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          
          const formattedStartDate = formatDateToISO(startDate);
          const formattedDueDate = formatDateToISO(dueDate);
          
          if (!formattedStartDate || !formattedDueDate) {
            console.error('Invalid dates for order:', order.number, { startDate, dueDate });
            return null;
          }

          // Calculate current due status
          const currentDueStatus = calculateDueStatus(dueDate);
          
          // Ensure status is either "Productive" or "Rework"
          const validStatus = order.status === 'Rework' ? 'Rework' : 'Productive';
          
          return {
            id: order._id.toString(),
            number: order.number,
            type: order.type || '',
            status: validStatus,
            description: order.description || '',
            dueStatus: currentDueStatus,
            dueDate: formattedDueDate,
            startDate: formattedStartDate,
            sessions: order.sessions || []
          };
        }).filter(Boolean);

        res.status(200).json(formattedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
      }
      break;

    case 'POST':
      try {
        const { type, description, status, startDate, dueDate } = req.body;
        
        // Generate random order number between 1 and 1000
        const randomNum = Math.floor(Math.random() * 1000) + 1;
        const orderNumber = String(randomNum).padStart(4, '0');
        
        // Parse and validate dates
        const validStartDate = new Date(startDate);
        const validDueDate = new Date(dueDate);
        
        if (isNaN(validStartDate.getTime()) || isNaN(validDueDate.getTime())) {
          throw new Error('Invalid dates provided');
        }
        
        // Calculate initial due status
        const dueStatus = calculateDueStatus(validDueDate);
        
        // Ensure status is either "Productive" or "Rework"
        const validStatus = status === 'Rework' ? 'Rework' : 'Productive';
        
        // Create order with validated status
        const order = await Order.create({
          number: orderNumber,
          type: type || '',
          description: description ? description.trim() : '',
          status: validStatus,
          dueStatus,
          startDate: validStartDate,
          dueDate: validDueDate,
          sessions: []
        });

        // Format order for response
        const formattedOrder = {
          id: order._id.toString(),
          number: order.number,
          type: order.type,
          status: order.status,
          description: order.description,
          dueStatus: order.dueStatus,
          dueDate: order.dueDate.toISOString(),
          startDate: order.startDate.toISOString(),
          sessions: []
        };

        // Emit the new order to all connected clients via Socket.IO
        if (req.io) {
          req.io.emit('orderCreated', formattedOrder);
        }

        res.status(201).json(formattedOrder);
      } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order: ' + error.message });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
} 