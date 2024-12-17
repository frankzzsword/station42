export enum WorkOrderStatus {
  Productive = "Productive",
  Rework = "Rework",
  OnHold = "On Hold",
  Completed = "Completed"
}

export enum DueStatus {
  DueNow = "Due Now",
  DueSoon = "Due Soon",
  DueLater = "Due Later",
  Overdue = "Overdue"
}

export interface WorkSession {
  startTime: string | Date;
  endTime?: string | Date;
  employeeName: string;
  duration: number;
  isActive?: boolean;
  orderId?: string;
}

export interface OrderTime {
  totalSeconds: number;
  currentSessionSeconds: number;
  lastActiveDate: string | Date;
  isActive: boolean;
  employeeName: string;
  sessions: WorkSession[];
  lastUpdate?: number;
}

export interface Employee {
  id: string;
  name: string;
  isActive: boolean;
  lastActiveTime?: Date;
}

export interface WorkOrder {
  id: string;
  number: string;
  type: string;
  status: WorkOrderStatus;
  description: string;
  dueStatus: DueStatus;
  dueDate: Date;
  startDate: Date;
  sessions?: WorkSession[];
  activeSessions?: WorkSession[];
}

export interface RangeTimer {
  orderTimes: {
    [orderId: string]: OrderTime;
  };
}

export interface RangeTimerState {
  elapsedSeconds: number;
  isRunning: boolean;
  selectedOrder?: string;
  orderTimes: Record<string, OrderTime>;
} 