import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Ranking = Record<string, unknown>;

function loadLeaderboard() {
  return getJson<{ leaderboard: Ranking[] }>('/api/leaderboard').then(({ leaderboard }) => leaderboard);
}

export default function Leaderboard() {
  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      loadItems={loadLeaderboard}
      emptyText="No leaderboard"
    />
  );
}
