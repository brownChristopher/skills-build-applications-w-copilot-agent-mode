import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Activity = Record<string, unknown>;

function loadActivities() {
  return getJson<{ activities: Activity[] }>('/api/activities').then(({ activities }) => activities);
}

export default function Activities() {
  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      loadItems={loadActivities}
      emptyText="No activities"
    />
  );
}
