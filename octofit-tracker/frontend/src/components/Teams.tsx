import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Team = Record<string, unknown>;

function loadTeams() {
  return getJson<{ teams: Team[] }>('/api/teams').then(({ teams }) => teams);
}

export default function Teams() {
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      loadItems={loadTeams}
      emptyText="No teams"
    />
  );
}
