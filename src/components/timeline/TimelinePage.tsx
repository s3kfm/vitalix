'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { PageHeading } from '../ui/PageHeading';
import { Tabs } from '../ui/Tabs';
import { EmptyState } from '../ui/EmptyState';
import { TimelineItem } from './TimelineItem';
import type { TimelineItem as TimelineItemType } from '../../../app/api/timeline/route';

const viewOptions = ['All', 'Symptom', 'Dose', 'Measurement', 'Medication'] as const;
type View = (typeof viewOptions)[number];

export function TimelinePage() {
  const { data: items, isLoading, isError, refetch } = useQuery<TimelineItemType[]>({
    queryKey: ['timeline'],
  });

  const [filter, setFilter] = useState<View>('All');
  const [query, setQuery] = useState('');

  const filtered = (items ?? [])
    .filter((item) => {
      if (filter === 'All') return true;
      return item.kind === filter.toLowerCase();
    })
    .filter((item) =>
      `${item.title} ${item.detail}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );

  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="YOUR HEALTH TIMELINE"
        title="Every moment, in order"
        description="A chronological feed of symptoms, doses, measurements, and medications."
      />

      <section className="panel">
        <div className="panel-title">
          <div>
            <h2>Your health timeline</h2>
            <p>Small updates. A more complete picture.</p>
          </div>
          <label className="search-field">
            <Search size={16} />
            <input
              aria-label="Search timeline"
              placeholder="Search your records"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>

        <div className="feed-tabs">
          <Tabs options={viewOptions} value={filter} onChange={setFilter} />
        </div>

        <div>
          {isLoading && (
            <div className="empty-state">
              <p>Loading timeline...</p>
            </div>
          )}
          {isError && (
            <p role="alert" style={{ padding: '22px', color: 'var(--muted)' }}>
              Could not load timeline.{' '}
              <button className="text-button" onClick={() => void refetch()}>
                Retry
              </button>
            </p>
          )}

          {!isLoading &&
            !isError &&
            filtered.map((item) => (
              <TimelineItem key={item.id} item={item} />
            ))}

          {!isLoading && !isError && !filtered.length && (
            <EmptyState
              title="No timeline entries yet"
              description="Your recorded health updates will appear here."
            />
          )}
        </div>
      </section>
    </div>
  );
}