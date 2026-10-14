import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Item = Record<string, unknown>;

type Props = {
  title: string;
  description: string;
  endpoint: string;
  listKey: string;
  emptyText: string;
};

function formatItem(item: Item) {
  if (typeof item.teamName === 'string' && (typeof item.totalPoints === 'number' || typeof item.rank === 'number')) {
    return `${item.teamName} ${item.totalPoints}`.trim();
  }

  const preferred = [
    item.type,
    item.title,
    item.name,
    item.teamName,
    item.reason,
    item.label,
    item.category,
    item.totalPoints,
    item.points,
    item.minutes,
  ].find((value) => typeof value === 'string' || typeof value === 'number');

  if (preferred === undefined) {
    const fallback = Object.values(item).find((value) => typeof value === 'string' || typeof value === 'number');
    return fallback === undefined ? 'Unknown item' : String(fallback);
  }

  return String(preferred);
}

export function CapabilityCard({ title, description, endpoint, listKey, emptyText }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        const payload = await getJson<Record<string, unknown>>(endpoint);
        if (!isMounted) return;

        const list = Array.isArray(payload[listKey]) ? (payload[listKey] as Item[]) : [];
        setItems(list);
      } catch {
        if (isMounted) {
          setError(`Unable to load ${title.toLowerCase()}.`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [endpoint, listKey, title]);

  if (isLoading) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">{title}</h2>
          <p>{description}</p>
          <p role="status">Loading {title.toLowerCase()}...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">{title}</h2>
          <p>{description}</p>
          <p role="alert">{error}</p>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">{title}</h2>
          <p>{description}</p>
          <p>{emptyText}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        <ul className="list-group list-group-flush">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="list-group-item">{formatItem(item)}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
