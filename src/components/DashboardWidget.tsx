import React from 'react';

interface DashboardWidgetProps {
  title: string;
  children: React.ReactNode;
  dragHandleClass?: string;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({ 
  title, 
  children,
  dragHandleClass = 'drag-handle'
}) => {
  return (
    <div className="bg-white rounded-lg shadow h-full overflow-hidden flex flex-col">
      <div className={`px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center ${dragHandleClass} cursor-move`}>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <div className="flex items-center space-x-2">
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      <div className="p-4 flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}; 