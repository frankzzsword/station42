import { Card, Metric, Text, Grid } from "@tremor/react";
import { useStore } from "@/store";

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export default function StatsCards() {
  const { orders, rangeTimer } = useStore();
  
  // Calculate metrics
  const activeOrders = Object.values(rangeTimer.orderTimes).filter(time => time.isActive).length;
  
  const totalOrdersToday = orders.filter(order => {
    const today = new Date();
    return order.startDate.toDateString() === today.toDateString();
  }).length;
  
  const totalTimeToday = Object.values(rangeTimer.orderTimes).reduce((total, time) => {
    const today = new Date().toDateString();
    const sessionTimeToday = time.sessions
      .filter(session => new Date(session.startTime).toDateString() === today)
      .reduce((acc, session) => acc + session.duration, 0);
    
    const currentSessionTime = time.isActive && 
      new Date(time.lastActiveDate).toDateString() === today ? 
      time.currentSessionSeconds : 0;
    
    return total + sessionTimeToday + currentSessionTime;
  }, 0);

  return (
    <Grid numItemsLg={3} className="gap-6">
      <Card>
        <Text>Active Orders</Text>
        <Metric>{activeOrders}</Metric>
      </Card>
      <Card>
        <Text>Orders Today</Text>
        <Metric>{totalOrdersToday}</Metric>
      </Card>
      <Card>
        <Text>Total Time Today</Text>
        <Metric>{formatTime(totalTimeToday)}</Metric>
      </Card>
    </Grid>
  );
} 