'use client';

import { DashboardWidget } from '../DashboardWidget';
import ContentQuickActionCard from '../admin/content-ai/ContentQuickActionCard';

export const ContentAIWidget = () => {
  return (
    <DashboardWidget title="Content AI">
      <div className="-mt-4 -mx-4">
        <ContentQuickActionCard />
      </div>
    </DashboardWidget>
  );
}; 