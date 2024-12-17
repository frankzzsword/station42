const mongoose = require('mongoose');

// First, clear any existing models to prevent schema caching
if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

// Define a clean session schema
const sessionSchema = new mongoose.Schema({
  employeeName: String,
  startTime: Date,
  endTime: Date,
  duration: Number
}, {
  _id: false,
  strict: true
});

// Define the order schema
const orderSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true,
    unique: true
  },
  type: String,
  status: {
    type: String,
    enum: ['Productive', 'Rework'],
    default: 'Productive'
  },
  description: String,
  dueStatus: String,
  dueDate: Date,
  startDate: Date,
  sessions: {
    type: [sessionSchema],
    default: []
  }
}, {
  timestamps: true,
  strict: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Ensure id is set before deleting _id
      ret.id = ret._id.toString();
      // Remove MongoDB specific fields
      delete ret._id;
      delete ret.__v;
      // Transform dates to ISO strings
      if (ret.dueDate) ret.dueDate = ret.dueDate.toISOString();
      if (ret.startDate) ret.startDate = ret.startDate.toISOString();
      if (ret.createdAt) ret.createdAt = ret.createdAt.toISOString();
      if (ret.updatedAt) ret.updatedAt = ret.updatedAt.toISOString();
      // Transform sessions dates
      if (ret.sessions) {
        ret.sessions = ret.sessions.map(session => ({
          ...session,
          startTime: session.startTime.toISOString(),
          endTime: session.endTime ? session.endTime.toISOString() : null
        }));
      }
      return ret;
    }
  }
});

// Create and export the model
const Order = mongoose.model('Order', orderSchema);
module.exports = Order; 