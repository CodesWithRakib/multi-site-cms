'use client';

import React, { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import type { PostPublicationItem } from '@multi-site-cms/types';
import { ShellLayout } from '@/components/shell';
import { useAdmin } from '@/lib/admin-context';
import {
  PublishingModal,
  type PublishingActionType,
} from '@/features/posts/components/PublishingModal';
import { useListPostsQuery, useGetPublishingHealthQuery } from '@/lib/cms-api';
import {
  CalendarHeader,
  CalendarMetricsCards,
  CalendarMonthGrid,
  CalendarListView,
  QuickScheduleDialog,
  type CalendarEvent,
  type CalendarDayCell,
  type CalendarViewMode,
} from '@/features/calendar';

export default function PublishingCalendarPage() {
  const { locale, activeSiteId, activeSite, availableSites } = useAdmin();
  const timezone = activeSite?.timezone || 'UTC';

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [selectedSiteId, setSelectedSiteId] = useState<string>(activeSiteId || '');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<PublishingActionType>('reschedule');
  const [targetPub, setTargetPub] = useState<PostPublicationItem | null>(null);
  const [targetTitle, setTargetTitle] = useState<string>('');
  const [quickScheduleOpen, setQuickScheduleOpen] = useState(false);
  const [selectedDateForSchedule, setSelectedDateForSchedule] = useState<Date | null>(null);

  const { data: postsData, isLoading, refetch } = useListPostsQuery({
    siteId: selectedSiteId || undefined,
    type: typeFilter || undefined,
    limit: 100,
  });

  const { data: health } = useGetPublishingHealthQuery(undefined, {
    pollingInterval: 30000,
  });

  // Extract events from publications (scheduledFor or publishedAt)
  const events = useMemo<CalendarEvent[]>(() => {
    const list: CalendarEvent[] = [];
    const posts = postsData?.items || [];

    for (const post of posts) {
      const pubs = post.publications || [];
      for (const pub of pubs) {
        if (selectedSiteId && pub.siteId !== selectedSiteId) continue;
        if (statusFilter && pub.status !== statusFilter) continue;

        const dateStr = pub.scheduledFor || pub.publishedAt;
        if (!dateStr) continue;

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) continue;

        const site = availableSites.find((s) => s.id === pub.siteId);

        list.push({
          id: `${post.id}-${pub.id}`,
          postId: post.id,
          publicationId: pub.id,
          siteId: pub.siteId,
          siteName: site?.name || 'Site',
          title: post.currentRevision?.title || pub.slug,
          slug: pub.slug,
          type: post.type,
          status: pub.status,
          date,
          publication: pub,
        });
      }
    }

    return list.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [postsData?.items, selectedSiteId, statusFilter, availableSites]);

  // Calendar month grid generation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = useMemo<CalendarDayCell[]>(() => {
    const days: CalendarDayCell[] = [];
    const todayStr = new Date().toDateString();

    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      days.push({
        dayNumber: prevMonthDays - i,
        date: d,
        isCurrentMonth: false,
        isToday: d.toDateString() === todayStr,
        events: [],
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dayEvents = events.filter(
        (e) =>
          e.date.getFullYear() === year && e.date.getMonth() === month && e.date.getDate() === i,
      );
      days.push({
        dayNumber: i,
        date: d,
        isCurrentMonth: true,
        isToday: d.toDateString() === todayStr,
        events: dayEvents,
      });
    }

    // Next month padding to fill grid
    const remaining = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        dayNumber: i,
        date: d,
        isCurrentMonth: false,
        isToday: d.toDateString() === todayStr,
        events: [],
      });
    }

    return days;
  }, [year, month, firstDayOfMonth, daysInMonth, events]);

  const monthName = new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-US', {
    month: 'long',
    year: 'numeric',
  }).format(currentDate);

  const handleOpenActionModal = (pub: PostPublicationItem, title: string, action: PublishingActionType) => {
    setModalAction(action);
    setTargetPub(pub);
    setTargetTitle(title);
    setModalOpen(true);
  };

  return (
    <ShellLayout>
      <div className="w-full space-y-6 pb-16">
        <CalendarHeader
          monthName={monthName}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onPrevMonth={() => setCurrentDate(new Date(year, month - 1, 1))}
          onNextMonth={() => setCurrentDate(new Date(year, month + 1, 1))}
          onToday={() => setCurrentDate(new Date())}
          activeSite={activeSite}
          availableSites={availableSites}
          selectedSiteId={selectedSiteId}
          onSiteChange={setSelectedSiteId}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onScheduleClick={() => {
            setSelectedDateForSchedule(null);
            setQuickScheduleOpen(true);
          }}
          timezone={timezone}
        />

        {/* Top Metric Stat Cards */}
        <CalendarMetricsCards
          events={events}
          scheduledPendingCount={health?.scheduledPublicationsPending}
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <p className="text-xs font-semibold text-slate-400">Loading scheduled calendar...</p>
          </div>
        ) : viewMode === 'month' ? (
          <CalendarMonthGrid
            days={calendarDays}
            timezone={timezone}
            onEventClick={(ev) => handleOpenActionModal(ev.publication, ev.title, ev.status === 'scheduled' ? 'reschedule' : 'unpublish')}
            onDateClick={(d) => {
              setSelectedDateForSchedule(d);
              setQuickScheduleOpen(true);
            }}
          />
        ) : (
          <CalendarListView
            events={events}
            locale={locale}
            timezone={timezone}
            onAction={(ev, action) => handleOpenActionModal(ev.publication, ev.title, action)}
          />
        )}
      </div>

      {targetPub && (
        <PublishingModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setTargetPub(null);
          }}
          action={modalAction}
          publication={targetPub}
          postTitle={targetTitle}
          onSuccess={() => refetch()}
        />
      )}

      <QuickScheduleDialog
        isOpen={quickScheduleOpen}
        onClose={() => setQuickScheduleOpen(false)}
        initialDate={selectedDateForSchedule}
        availableSites={availableSites}
        defaultSiteId={selectedSiteId || activeSiteId || undefined}
        onSuccess={() => refetch()}
      />
    </ShellLayout>
  );
}
