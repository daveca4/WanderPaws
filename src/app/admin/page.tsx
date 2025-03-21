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
      
      {/* Quick Access Section - Added for the marketing features */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Marketing Dashboard</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">Manage Campaigns</div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-5">
                <a href="/admin/marketing" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700">
                  Go to Marketing
                </a>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Subscription Reports</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">Analytics & Insights</div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-5">
                <a href="/admin/reports" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                  View Reports
                </a>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Subscription Management</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">Manage Plans & Users</div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-5">
                <a href="/admin/subscriptions" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                  Manage Subscriptions
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
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