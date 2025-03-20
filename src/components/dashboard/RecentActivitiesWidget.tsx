import { DashboardWidget } from '../DashboardWidget';
import { RecentActivities } from '../RecentActivities';

export const RecentActivitiesWidget = () => {
  return (
    <DashboardWidget title="Recent Activities">
      <RecentActivities />
    </DashboardWidget>
  );
}; 