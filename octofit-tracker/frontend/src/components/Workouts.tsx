import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

const userEmail = 'mona@example.com';
type Suggestion = Record<string, unknown>;

function loadSuggestions() {
  return getJson<{ suggestions: Suggestion[] }>(
    `/api/workouts/suggestions/${encodeURIComponent(userEmail)}`,
  ).then(({ suggestions }) => suggestions);
}

export default function Workouts() {
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loadItems={loadSuggestions}
      emptyText="No workout suggestions"
    />
  );
}
