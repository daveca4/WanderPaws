import { useState, useEffect } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { SummaryWidget } from '@/components/dashboard/SummaryWidget';
import { PendingAssessmentsWidget } from '@/components/dashboard/PendingAssessmentsWidget';
import { ActiveSubscriptionsWidget } from '@/components/dashboard/ActiveSubscriptionsWidget';
import { UpcomingWalksWidget } from '@/components/dashboard/UpcomingWalksWidget';
import { AIRecommendationsWidget } from '@/components/dashboard/AIRecommendationsWidget';
import { RecentActivitiesWidget } from '@/components/dashboard/RecentActivitiesWidget';
import { ContentAIWidget } from '@/components/dashboard/ContentAIWidget';
import { MediaGalleryWidget } from '@/components/dashboard/MediaGalleryWidget';
import { WeatherMonitoringWidget } from '@/components/dashboard/WeatherMonitoringWidget';

import {
  dashboardWidgets,
  defaultDesktopLayout,
  defaultMobileLayout,
  loadLayout,
  saveLayout,
  getWidgetById,
  TabType,
  TabLayouts
} from '@/lib/dashboardLayout';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface TabConfig {
  id: TabType;
  label: string;
  widgets: string[];
}

const tabConfigs: TabConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    widgets: ['summaryWidget', 'weatherMonitoringWidget', 'recentActivitiesWidget']
  },
  {
    id: 'operations',
    label: 'Operations',
    widgets: ['pendingAssessmentsWidget', 'activeSubscriptionsWidget', 'upcomingWalksWidget']
  },
  {
    id: 'content',
    label: 'Content',
    widgets: ['contentAIWidget', 'mediaGalleryWidget']
  },
  {
    id: 'analytics',
    label: 'Analytics',
    widgets: ['aiRecommendationsWidget']
  }
];

// Create tab-specific layouts
const createTabLayouts = (): TabLayouts => {
  const tabLayouts: TabLayouts = {
    overview: [
      { i: 'summaryWidget', x: 0, y: 0, w: 12, h: 8, static: false },
      { i: 'weatherMonitoringWidget', x: 0, y: 8, w: 6, h: 18, static: false },
      { i: 'recentActivitiesWidget', x: 6, y: 8, w: 6, h: 18, static: false }
    ],
    operations: [
      { i: 'pendingAssessmentsWidget', x: 0, y: 0, w: 4, h: 18, static: false },
      { i: 'activeSubscriptionsWidget', x: 4, y: 0, w: 4, h: 18, static: false },
      { i: 'upcomingWalksWidget', x: 8, y: 0, w: 4, h: 18, static: false }
    ],
    content: [
      { i: 'contentAIWidget', x: 0, y: 0, w: 6, h: 18, static: false },
      { i: 'mediaGalleryWidget', x: 6, y: 0, w: 6, h: 18, static: false }
    ],
    analytics: [
      { i: 'aiRecommendationsWidget', x: 0, y: 0, w: 12, h: 18, static: false }
    ]
  };
  
  return tabLayouts;
};

// Function to verify and fix layout overlaps
const verifyLayout = (layout: Layout[]) => {
  // Sort by y position so we process from top to bottom
  const sortedLayout = [...layout].sort((a, b) => {
    return a.y - b.y;
  });

  const fixedLayout: Layout[] = [];
  
  // Process each widget to ensure no overlaps
  sortedLayout.forEach((item) => {
    // Check if this item would overlap with any already placed item
    let newY = item.y;
    let overlap = true;
    
    while (overlap) {
      overlap = false;
      
      for (const placedItem of fixedLayout) {
        // Check if current position would cause overlap
        if (
          newY < placedItem.y + placedItem.h && 
          newY + item.h > placedItem.y &&
          item.x < placedItem.x + placedItem.w && 
          item.x + item.w > placedItem.x
        ) {
          // There is an overlap, move this item below the placedItem
          newY = placedItem.y + placedItem.h;
          overlap = true;
          break;
        }
      }
    }
    
    // Add item to fixed layout with potentially updated y position
    fixedLayout.push({ ...item, y: newY });
  });
  
  return fixedLayout;
};

export function TabbedDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isEditMode, setIsEditMode] = useState(false);
  const [tabLayouts] = useState<TabLayouts>(createTabLayouts());
  
  // Initialize layouts for each tab
  const [layouts, setLayouts] = useState<TabLayouts>(() => {
    // Try to load saved layouts
    const savedLayout = loadLayout();
    
    // If saved layouts exist, use them, otherwise use defaults
    if (savedLayout) {
      // For backwards compatibility, ensure we have layouts for all tabs
      const tabLayoutsInitial = createTabLayouts();
      
      // Verify all layouts to prevent overlaps
      Object.keys(savedLayout).forEach(tabKey => {
        const key = tabKey as TabType;
        if (!savedLayout[key]) {
          savedLayout[key] = tabLayoutsInitial[key];
        } else {
          // Verify the layout to prevent any overlaps
          savedLayout[key] = verifyLayout(savedLayout[key]);
        }
      });
      
      return savedLayout;
    } else {
      // Use default layouts for all tabs
      return tabLayouts;
    }
  });

  // Handler for layout changes
  const handleLayoutChange = (currentLayout: any) => {
    // Apply verification to prevent overlaps
    const verifiedLayout = verifyLayout(currentLayout);
    
    const newLayouts = {
      ...layouts,
      [activeTab]: verifiedLayout
    };
    
    setLayouts(newLayouts);
    saveLayout(newLayouts);
  };

  // Handle resize event to properly size widgets
  const handleResize = () => {
    // Force a resize event after component updates
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  };

  // Reset to default layouts
  const resetLayout = () => {
    const defaultLayouts = createTabLayouts();
    setLayouts(defaultLayouts);
    saveLayout(defaultLayouts);
  };

  // Render widget based on widget id
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
      case 'contentAI':
        return <ContentAIWidget />;
      case 'mediaGallery':
        return <MediaGalleryWidget />;
      case 'weatherMonitoring':
        return <WeatherMonitoringWidget />;
      default:
        return <div>Unknown widget type: {widget.type}</div>;
    }
  };

  // Get current tab's layout
  const currentTabLayout = layouts[activeTab] || [];

  return (
    <div className="px-6 py-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          {tabConfigs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
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
              className="px-4 py-2 rounded bg-white text-gray-800 hover:bg-gray-100"
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
        layouts={{ lg: currentTabLayout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
        rowHeight={50}
        isDraggable={isEditMode}
        isResizable={true}
        resizeHandles={['se']}
        onLayoutChange={(layout) => handleLayoutChange(layout)}
        preventCollision={true}
        compactType="vertical"
        margin={[24, 24]}
        containerPadding={[24, 24]}
        autoSize={true}
        style={{ minHeight: '100vh' }}
        verticalCompact={true}
        useCSSTransforms={true}
        onResizeStop={handleResize}
      >
        {currentTabLayout.map(layout => (
          <div key={layout.i} className="bg-white shadow-sm rounded-lg overflow-visible">
            {renderWidget(layout.i)}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
} 