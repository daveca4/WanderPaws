import React from 'react';

export function RecentActivitiesWidget() {
  // Mock data for recent activities
  const activities = [
    {
      id: 1,
      user: 'Luna',
      action: 'completed a 0.8 km walk',
      timestamp: new Date(2025, 5, 18, 9, 30),
      avatar: '👧'
    },
    {
      id: 2,
      user: 'Max',
      action: 'added a new dog profile',
      timestamp: new Date(2025, 5, 18, 9, 15),
      avatar: '👨'
    },
    {
      id: 3,
      user: 'Sophia',
      action: 'cancelled scheduled walk',
      timestamp: new Date(2025, 5, 18, 8, 45),
      avatar: '👩'
    },
    {
      id: 4,
      user: 'Rocky',
      action: 'received a 5-star review',
      timestamp: new Date(2025, 5, 18, 8, 30),
      avatar: '🐕'
    }
  ];

  return (
    <div className="h-full w-full p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
      <div className="space-y-4">
        {activities.map(activity => (
          <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">
              {activity.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {activity.user} <span className="font-normal">{activity.action}</span>
              </p>
              <p className="text-xs text-gray-500">
                {activity.timestamp.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 