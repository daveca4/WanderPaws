'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { SummaryWidget } from '@/components/dashboard/SummaryWidget';
import { PendingAssessmentsWidget } from '@/components/dashboard/PendingAssessmentsWidget';
import { ActiveSubscriptionsWidget } from '@/components/dashboard/ActiveSubscriptionsWidget';
import { UpcomingWalksWidget } from '@/components/dashboard/UpcomingWalksWidget';
import { AIRecommendationsWidget } from '@/components/dashboard/AIRecommendationsWidget';
import { RecentActivitiesWidget } from '@/components/dashboard/RecentActivitiesWidget';

import {
  dashboardWidgets,
  defaultDesktopLayout,
  defaultMobileLayout,
  loadLayout,
  saveLayout,
  getWidgetById
} from '@/lib/dashboardLayout';

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // State for layouts
  const [layouts, setLayouts] = useState(() => {
    const savedLayout = loadLayout();
    return savedLayout || {
      lg: defaultDesktopLayout,
      md: defaultDesktopLayout.map(item => ({ ...item, w: Math.min(item.w, 6) })),
      sm: defaultDesktopLayout.map(item => ({ ...item, w: Math.min(item.w, 4) })),
      xs: defaultMobileLayout,
    };
  });
  
  // State for indicating edit mode
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    // If user is not an admin, redirect to login page
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Handler for layout changes
  const handleLayoutChange = (currentLayout: any, allLayouts: any) => {
    setLayouts(allLayouts);
    saveLayout(allLayouts);
  };

  // Reset to default layouts
  const resetLayout = () => {
    const defaultLayouts = {
      lg: defaultDesktopLayout,
      md: defaultDesktopLayout.map(item => ({ ...item, w: Math.min(item.w, 6) })),
      sm: defaultDesktopLayout.map(item => ({ ...item, w: Math.min(item.w, 4) })),
      xs: defaultMobileLayout,
    };
    setLayouts(defaultLayouts);
    saveLayout(defaultLayouts);
  };

  // Render the widget component based on the widget type
  const renderWidget = (widgetId: string) => {
    const widget = getWidgetById(widgetId);
    
    if (!widget) return null;
    
    switch (widget.type) {
      case 'summary':
        return <SummaryWidget />;
      case 'pendingAssessments':
        return <PendingAssessmentsWidget />;
      case 'activeSubscriptions':
        return <ActiveSubscriptionsWidget />;
      case 'upcomingWalks':
        return <UpcomingWalksWidget />;
      case 'aiRecommendations':
        return <AIRecommendationsWidget />;
      case 'recentActivities':
        return <RecentActivitiesWidget />;
      default:
        return <div>Unknown widget type</div>;
    }
  };

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex space-x-3">
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-4 py-2 rounded ${
              isEditMode 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isEditMode ? 'Save Layout' : 'Edit Layout'}
          </button>
          {isEditMode && (
            <button 
              onClick={resetLayout}
              className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              Reset Layout
            </button>
          )}
        </div>
      </div>

      {isEditMode && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <p className="font-bold">Layout Edit Mode</p>
          <p>Drag widgets to rearrange the dashboard. Click and drag the bottom corner of each widget to resize.</p>
        </div>
      )}
      
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 6, md: 6, sm: 4, xs: 1 }}
        rowHeight={100}
        containerPadding={[0, 0]}
        margin={[16, 16]}
        onLayoutChange={handleLayoutChange}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        draggableHandle=".drag-handle"
      >
        {defaultDesktopLayout.map(item => (
          <div key={item.i} data-grid={item}>
            {renderWidget(item.i)}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
} 