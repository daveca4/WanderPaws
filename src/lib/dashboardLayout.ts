import { Layout } from 'react-grid-layout';

// Define widget types
export type WidgetType = 
  | 'summary' 
  | 'pendingAssessments' 
  | 'activeSubscriptions' 
  | 'upcomingWalks' 
  | 'aiRecommendations' 
  | 'recentActivities';

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
    id: 'summary', 
    type: 'summary', 
    title: 'Dashboard Summary', 
    minH: 2,
    minW: 6
  },
  { 
    id: 'pendingAssessments', 
    type: 'pendingAssessments', 
    title: 'Pending Assessments', 
    minH: 4,
    minW: 3
  },
  { 
    id: 'activeSubscriptions', 
    type: 'activeSubscriptions', 
    title: 'Active Subscriptions', 
    minH: 4,
    minW: 3
  },
  { 
    id: 'upcomingWalks', 
    type: 'upcomingWalks', 
    title: 'Upcoming Walks', 
    minH: 4,
    minW: 4
  },
  { 
    id: 'aiRecommendations', 
    type: 'aiRecommendations', 
    title: 'AI Recommendations', 
    minH: 4,
    minW: 2
  },
  { 
    id: 'recentActivities', 
    type: 'recentActivities', 
    title: 'Recent Activities', 
    minH: 4,
    minW: 6
  }
];

// Default layout for larger screens (desktop/laptop)
export const defaultDesktopLayout: Layout[] = [
  { i: 'summary', x: 0, y: 0, w: 6, h: 2, static: false },
  { i: 'pendingAssessments', x: 0, y: 2, w: 3, h: 4, static: false },
  { i: 'activeSubscriptions', x: 3, y: 2, w: 3, h: 4, static: false },
  { i: 'upcomingWalks', x: 0, y: 6, w: 4, h: 4, static: false },
  { i: 'aiRecommendations', x: 4, y: 6, w: 2, h: 4, static: false },
  { i: 'recentActivities', x: 0, y: 10, w: 6, h: 4, static: false }
];

// Default layout for mobile screens
export const defaultMobileLayout: Layout[] = [
  { i: 'summary', x: 0, y: 0, w: 1, h: 2, static: false },
  { i: 'pendingAssessments', x: 0, y: 2, w: 1, h: 4, static: false },
  { i: 'activeSubscriptions', x: 0, y: 6, w: 1, h: 4, static: false },
  { i: 'upcomingWalks', x: 0, y: 10, w: 1, h: 4, static: false },
  { i: 'aiRecommendations', x: 0, y: 14, w: 1, h: 4, static: false },
  { i: 'recentActivities', x: 0, y: 18, w: 1, h: 4, static: false }
];

// Constants for localStorage keys
export const DASHBOARD_LAYOUT_KEY = 'wanderpaws_admin_dashboard_layout';

// Save layout to localStorage
export const saveLayout = (layouts: { [key: string]: Layout[] }) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DASHBOARD_LAYOUT_KEY, JSON.stringify(layouts));
  }
};

// Load layout from localStorage
export const loadLayout = (): { [key: string]: Layout[] } | null => {
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