import React from 'react';
import { format } from 'date-fns';
import { ClockIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { WorkSession } from '@/types';

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

interface SessionTimeCardProps {
  session: WorkSession & {
    startTime: string;
    endTime?: string | null;
    employeeName: string;
    duration: number;
  };
}

const SessionTimeCard: React.FC<SessionTimeCardProps> = ({ session }) => {
  return (
    <div className="flex flex-col p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <ClockIcon className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-600">
            {format(new Date(session.startTime), "HH:mm")} - {
              session.endTime 
                ? format(new Date(session.endTime), "HH:mm")
                : "In Progress"
            }
          </span>
        </div>
        <span className="font-mono text-sm font-medium text-gray-700">
          {formatTime(session.duration)}
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        <UserCircleIcon className="h-5 w-5 text-blue-500" />
        <span className="text-sm text-gray-600">{session.employeeName}</span>
      </div>
    </div>
  );
};

export default SessionTimeCard; 