import { DashboardWidget } from '../DashboardWidget';
import { AIRecommendations } from '../AIRecommendations';

export const AIRecommendationsWidget = () => {
  return (
    <DashboardWidget title="AI Recommendations">
      <AIRecommendations />
    </DashboardWidget>
  );
}; 