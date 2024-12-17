export function calculateDueStatus(dueDate: Date | string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Convert dueDate to Date object if it's a string
  const dueDateObj = new Date(dueDate);
  dueDateObj.setHours(0, 0, 0, 0);

  // Calculate days difference
  const daysDiff = Math.floor((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // If due date is before today, it's overdue
  if (daysDiff < 0) {
    return 'Overdue';
  }
  
  // If due date is within 7 days (including today), it's Due Now
  if (daysDiff <= 7) {
    return 'Due Now';
  }
  
  // If due date is between 7 and 14 days
  if (daysDiff <= 14) {
    return 'Due Soon';
  }
  
  // If due date is beyond 14 days
  return 'Due Later';
} 