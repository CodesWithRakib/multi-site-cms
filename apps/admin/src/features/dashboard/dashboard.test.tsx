import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { DashboardMetricItem } from './components/dashboard-metric-item';
import { DashboardMetrics } from './components/dashboard-metrics';
import { ContentActivityChart } from './components/content-activity-chart';
import { RecentContent } from './components/recent-content';
import { RecentActivity } from './components/recent-activity';
import { QuickActions } from './components/quick-actions';
import { DashboardEmptyState } from './components/dashboard-empty-state';
import { FileText, Activity } from 'lucide-react';
import { AdminProvider } from '@/lib/admin-context';
import { StoreProvider } from '@multi-site-cms/redux';
import { makeStore } from '@/lib/store';

function renderWithProviders(element: React.ReactElement) {
  const store = makeStore();
  return renderToString(
    <StoreProvider store={store}>
      <AdminProvider>{element}</AdminProvider>
    </StoreProvider>,
  );
}

describe('Dashboard Components (Unit Tests)', () => {
  it('renders DashboardMetricItem with label, value, and subtext', () => {
    const html = renderToString(
      <DashboardMetricItem
        label="Total Content"
        value={42}
        subtext="Canonical source items"
        icon={FileText}
      />,
    );

    expect(html).toContain('Total Content');
    expect(html).toContain('42');
    expect(html).toContain('Canonical source items');
  });

  it('renders DashboardMetrics with accurate values for platform view', () => {
    const metrics = {
      totalContent: 10,
      publishedCount: 6,
      draftsCount: 2,
      scheduledCount: 2,
      archivedCount: 1,
      activeSitesCount: 2,
    };

    const html = renderWithProviders(
      <DashboardMetrics metrics={metrics} isLoading={false} isPlatformView={true} />,
    );

    expect(html).toContain('Total Content');
    expect(html).toContain('10');
    expect(html).toContain('Published');
    expect(html).toContain('6');
    expect(html).toContain('Active Sites');
    expect(html).toContain('2');
  });

  it('renders ContentActivityChart with data points and legend', () => {
    const series = [
      { date: '2026-10-30', published: 2, drafts: 1, scheduled: 0 },
      { date: '2026-10-31', published: 1, drafts: 0, scheduled: 1 },
      { date: '2026-11-01', published: 3, drafts: 2, scheduled: 1 },
    ];

    const html = renderWithProviders(
      <ContentActivityChart data={series} isLoading={false} days={30} />,
    );

    expect(html).toContain('Content Activity Over Time');
    expect(html).toContain('Published (');
    expect(html).toContain('Drafts (');
    expect(html).toContain('Scheduled (');
    expect(html).toContain('2026-10-30');
    expect(html).toContain('2026-11-01');
  });

  it('renders ContentActivityChart empty state when zero activity recorded', () => {
    const html = renderWithProviders(
      <ContentActivityChart data={[]} isLoading={false} days={30} />,
    );

    expect(html).toContain('No activity recorded in this time range');
  });

  it('renders RecentContent table with items and badges', () => {
    const items = [
      {
        id: 'pub-1',
        postId: 'post-1',
        title: 'Hidden Temples of Chiang Mai',
        slug: 'hidden-temples-chiang-mai',
        type: 'travel_guide',
        status: 'published',
        siteId: 'site-1',
        siteName: 'Travel Blog',
        siteKey: 'travel-blog',
        updatedAt: '2026-11-01T12:00:00Z',
        publishedAt: '2026-11-01T12:00:00Z',
        scheduledFor: null,
      },
    ];

    const html = renderWithProviders(
      <RecentContent items={items} isLoading={false} isPlatformView={true} />,
    );

    expect(html).toContain('Recent Content');
    expect(html).toContain('Hidden Temples of Chiang Mai');
    expect(html).toContain('hidden-temples-chiang-mai');
    expect(html).toContain('Travel Blog');
    expect(html).toContain('Published');
  });

  it('renders RecentActivity list with actor and action summary', () => {
    const events = [
      {
        id: 'evt-1',
        action: 'publication.publish',
        entityType: 'post_publication',
        entityId: 'pub-1',
        actorId: 'usr-1',
        actorName: 'Super Admin',
        actorEmail: 'admin@example.com',
        siteId: 'site-1',
        siteName: 'Travel Blog',
        createdAt: '2026-11-01T12:00:00Z',
        summary: 'Published "Hidden Temples" to Travel Blog',
      },
    ];

    const html = renderWithProviders(<RecentActivity items={events} isLoading={false} />);

    expect(html).toContain('Recent Editorial Activity');
    expect(html).toContain('Hidden Temples');
    expect(html).toContain('Super Admin');
  });

  it('renders QuickActions with functional navigation links', () => {
    const html = renderWithProviders(<QuickActions />);

    expect(html).toContain('Quick Actions');
    expect(html).toContain('href="/posts/new"');
    expect(html).toContain('href="/posts"');
    expect(html).toContain('href="/calendar"');
    expect(html).toContain('href="/media"');
  });

  it('renders DashboardEmptyState with custom title and description', () => {
    const html = renderToString(
      <DashboardEmptyState
        icon={Activity}
        title="Custom Empty State"
        description="Nothing to display here yet."
        actionLabel="Create Now"
        actionHref="/posts/new"
      />,
    );

    expect(html).toContain('Custom Empty State');
    expect(html).toContain('Nothing to display here yet.');
    expect(html).toContain('Create Now');
    expect(html).toContain('href="/posts/new"');
  });
});
