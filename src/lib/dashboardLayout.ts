import { Layout } from 'react-grid-layout';

// Define widget types
export type WidgetType = 
  | 'summary' 
  | 'pendingAssessments' 
  | 'activeSubscriptions' 
  | 'upcomingWalks' 
  | 'aiRecommendations' 
  | 'recentActivities'
  | 'contentAI'
  | 'mediaGallery'
  | 'weatherMonitoring';

// Interface for dashboard widgets
export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  minH: number;
  minW: number;
}

// Default widgets configuration
export const dashboardWidgets: DashboardWidget[] = [
  { 
    id: 'summaryWidget', 
    type: 'summary', 
    title: 'Dashboard Summary', 
    minH: 2,
    minW: 6
  },
  { 
    id: 'pendingAssessmentsWidget', 
    type: 'pendingAssessments', 
    title: 'Pending Assessments', 
    minH: 4,
    minW: 3
  },
  { 
    id: 'activeSubscriptionsWidget', 
    type: 'activeSubscriptions', 
    title: 'Active Subscriptions', 
    minH: 4,
    minW: 3
  },
  { 
    id: 'upcomingWalksWidget', 
    type: 'upcomingWalks', 
    title: 'Upcoming Walks', 
    minH: 4,
    minW: 4
  },
  { 
    id: 'aiRecommendationsWidget', 
    type: 'aiRecommendations', 
    title: 'AI Recommendations', 
    minH: 4,
    minW: 2
  },
  { 
    id: 'recentActivitiesWidget', 
    type: 'recentActivities', 
    title: 'Recent Activities', 
    minH: 4,
    minW: 6
  },
  { 
    id: 'contentAIWidget', 
    type: 'contentAI', 
    title: 'Content AI', 
    minH: 4,
    minW: 2
  },
  { 
    id: 'mediaGalleryWidget', 
    type: 'mediaGallery', 
    title: 'Media Gallery', 
    minH: 4,
    minW: 2
  },
  { 
    id: 'weatherMonitoringWidget', 
    type: 'weatherMonitoring', 
    title: 'Weather Monitoring', 
    minH: 4,
    minW: 4
  }
];

// Default layout for larger screens (desktop/laptop)
export const defaultDesktopLayout: Layout[] = [
  { i: 'summaryWidget', x: 0, y: 0, w: 6, h: 2, static: false },
  { i: 'weatherMonitoringWidget', x: 6, y: 0, w: 6, h: 4, static: false },
  { i: 'pendingAssessmentsWidget', x: 0, y: 2, w: 3, h: 4, static: false },
  { i: 'activeSubscriptionsWidget', x: 3, y: 2, w: 3, h: 4, static: false },
  { i: 'upcomingWalksWidget', x: 0, y: 6, w: 4, h: 4, static: false },
  { i: 'aiRecommendationsWidget', x: 4, y: 6, w: 2, h: 4, static: false },
  { i: 'recentActivitiesWidget', x: 0, y: 10, w: 6, h: 4, static: false },
  { i: 'contentAIWidget', x: 6, y: 4, w: 3, h: 4, static: false },
  { i: 'mediaGalleryWidget', x: 9, y: 4, w: 3, h: 4, static: false }
];

// Default layout for mobile screens
export const defaultMobileLayout: Layout[] = [
  { i: 'summaryWidget', x: 0, y: 0, w: 1, h: 2, static: false },
  { i: 'weatherMonitoringWidget', x: 0, y: 2, w: 1, h: 4, static: false },
  { i: 'pendingAssessmentsWidget', x: 0, y: 6, w: 1, h: 4, static: false },
  { i: 'activeSubscriptionsWidget', x: 0, y: 10, w: 1, h: 4, static: false },
  { i: 'upcomingWalksWidget', x: 0, y: 14, w: 1, h: 4, static: false },
  { i: 'aiRecommendationsWidget', x: 0, y: 18, w: 1, h: 4, static: false },
  { i: 'recentActivitiesWidget', x: 0, y: 22, w: 1, h: 4, static: false },
  { i: 'contentAIWidget', x: 0, y: 26, w: 1, h: 4, static: false },
  { i: 'mediaGalleryWidget', x: 0, y: 30, w: 1, h: 4, static: false }
];

// Constants for localStorage keys
export const DASHBOARD_LAYOUT_KEY = 'wanderpaws_admin_dashboard_layout';

// Tab-based layout interfaces
export type TabType = 'overview' | 'operations' | 'content' | 'analytics';
export type TabLayouts = Record<TabType, Layout[]>;

// Save layout to localStorage
export const saveLayout = (layouts: TabLayouts) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DASHBOARD_LAYOUT_KEY, JSON.stringify(layouts));
  }
};

// Load layout from localStorage
export const loadLayout = (): TabLayouts | null => {
  if (typeof window !== 'undefined') {
    const savedLayout = localStorage.getItem(DASHBOARD_LAYOUT_KEY);
    if (savedLayout) {
      try {
        return JSON.parse(savedLayout);
      } catch (e) {
        console.error('Error parsing saved layout', e);
      }
    }
  }
  return null;
};

// Get widget by ID
export const getWidgetById = (id: string): DashboardWidget | undefined => {
  return dashboardWidgets.find(widget => widget.id === id);
}; 