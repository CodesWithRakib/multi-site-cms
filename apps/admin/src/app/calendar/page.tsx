'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, Loader2, List, Grid } from 'lucide-react';
import type { PostPublicationItem } from '@multi-site-cms/types';
import { ShellLayout } from '@/components/shell';
import { useAdmin } from '@/lib/admin-context';
import { formatDateTime } from '@/lib/i18n';
import {
  PublishingModal,
  type PublishingActionType,
} from '@/features/posts/components/PublishingModal';
import { useListPostsQuery } from '@/lib/cms-api';

interface CalendarEvent {
  id: string;
  postId: string;
  publicationId: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  date: Date;
  publication: PostPublicationItem;
}

export default function PublishingCalendarPage() {
  const { t, locale, activeSiteId, activeSite } = useAdmin();
  const timezone = activeSite?.timezone || 'UTC';

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<PublishingActionType>('reschedule');
  const [targetPub, setTargetPub] = useState<PostPublicationItem | null>(null);
  const [targetTitle, setTargetTitle] = useState<string>('');

  const {
    data: postsData,
    isLoading,
    refetch,
  } = useListPostsQuery({
    siteId: activeSiteId || undefined,
    type: typeFilter || undefined,
    limit: 100,
  });

  // Extract events from publications (either scheduledFor or publishedAt)
  const events = useMemo<CalendarEvent[]>(() => {
    const list: CalendarEvent[] = [];
    const posts = postsData?.items || [];
    for (const post of posts) {
      const pub = activeSiteId
        ? post.publications?.find((p) => p.siteId === activeSiteId)
        : post.publications?.[0];

      if (!pub) continue;

      const dateStr = pub.scheduledFor || pub.publishedAt;
      if (!dateStr) continue;

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) continue;

      list.push({
        id: `${post.id}-${pub.id}`,
        postId: post.id,
        publicationId: pub.id,
        title: post.currentRevision?.title || pub.slug,
        slug: pub.slug,
        type: post.type,
        status: pub.status,
        date,
        publication: pub,
      });
    }
    return list;
  }, [postsData?.items, activeSiteId]);

  // Calendar navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Month grid generation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = useMemo(() => {
    const days: Array<{
      dayNumber: number;
      date: Date;
      isCurrentMonth: boolean;
      events: CalendarEvent[];
    }> = [];

    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      days.push({ dayNumber: prevMonthDays - i, date: d, isCurrentMonth: false, events: [] });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dayEvents = events.filter((e) => {
        return (
          e.date.getFullYear() === year && e.date.getMonth() === month && e.date.getDate() === i
        );
      });
      days.push({ dayNumber: i, date: d, isCurrentMonth: true, events: dayEvents });
    }

    // Next month padding to fill 35 or 42 grid cells
    const remaining = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ dayNumber: i, date: d, isCurrentMonth: false, events: [] });
    }

    return days;
  }, [year, month, firstDayOfMonth, daysInMonth, events]);

  const monthName = new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-US', {
    month: 'long',
    year: 'numeric',
  }).format(currentDate);

  const handleEventClick = (event: CalendarEvent) => {
    if (event.status === 'scheduled') {
      setModalAction('reschedule');
      setTargetPub(event.publication);
      setTargetTitle(event.title);
      setModalOpen(true);
    }
  };

  return (
    <ShellLayout>
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {t.nav.calendar}
              </h1>
              {activeSite && (
                <span className="rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  {activeSite.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Timeline view of upcoming scheduled releases and published editorial updates. (TZ:{' '}
              {timezone})
            </p>
          </div>

          {/* View Mode & Filter */}
          <div className="flex items-center gap-3">
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  viewMode === 'month'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Month</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Month Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 min-w-[180px]">
              {monthName}
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
            <button
              type="button"
              onClick={goToToday}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Today
            </button>
          </div>

          {/* Type filter */}
          <div className="w-44">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Content Types</option>
              <option value="travel_guide">Travel Guide</option>
              <option value="air_sports_update">Air Sports Update</option>
              <option value="article">Article</option>
            </select>
          </div>
        </div>

        {/* Calendar View Mode */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-400">Loading scheduled calendar...</p>
          </div>
        ) : viewMode === 'month' ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center py-2.5">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/60">
              {calendarDays.map((cell, idx) => {
                const isToday = cell.date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={idx}
                    className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors ${
                      cell.isCurrentMonth
                        ? 'bg-white dark:bg-slate-900'
                        : 'bg-slate-50/50 dark:bg-slate-950/40 opacity-40'
                    } ${isToday ? 'ring-2 ring-blue-500/30' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          isToday
                            ? 'flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>
                    </div>

                    {/* Events inside this day */}
                    <div className="flex-1 space-y-1 mt-1 overflow-hidden">
                      {cell.events.map((ev) => (
                        <div
                          key={ev.id}
                          onClick={() => handleEventClick(ev)}
                          className={`px-1.5 py-1 rounded-md text-[10px] font-semibold truncate border cursor-pointer transition-transform hover:scale-[1.02] ${
                            ev.status === 'scheduled'
                              ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300'
                              : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                          }`}
                          title={`${ev.title} (${ev.status})`}
                        >
                          <div className="flex items-center gap-1">
                            {ev.status === 'scheduled' ? (
                              <Clock className="w-2.5 h-2.5 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                            )}
                            <span className="truncate">{ev.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* List Fallback View */
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
            {events.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No publications scheduled for this view.
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          ev.status === 'scheduled'
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-emerald-100 text-emerald-600'
                        }`}
                      >
                        {ev.status === 'scheduled' ? (
                          <Clock className="w-4 h-4" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/posts/${ev.postId}/edit`}
                          className="font-bold text-xs text-slate-900 dark:text-slate-100 hover:text-blue-600"
                        >
                          {ev.title}
                        </Link>
                        <p className="text-[11px] text-slate-400">/{ev.slug}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
                        {formatDateTime(ev.date, locale, timezone)}
                      </span>
                      <Link
                        href={`/posts/${ev.postId}/edit`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
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
    </ShellLayout>
  );
}
