'use client';

import React, { useState } from 'react';
import type { EventTimelineBlockAttributes } from '../../extensions/event-timeline-block';

export interface TimelineBlockModalProps {
  onClose: () => void;
  onInsert: (attrs: EventTimelineBlockAttributes) => void;
}

export function TimelineBlockModal({ onClose, onInsert }: TimelineBlockModalProps) {
  const [timelineTitle, setTimelineTitle] = useState('');
  const [timelineTime, setTimelineTime] = useState('10:00 AM');
  const [timelineDesc, setTimelineDesc] = useState('');
  const [timelineStatus, setTimelineStatus] =
    useState<EventTimelineBlockAttributes['status']>('scheduled');
  const [windSpeed, setWindSpeed] = useState('');
  const [weatherCondition, setWeatherCondition] = useState('');
  const [alertLevel, setAlertLevel] =
    useState<EventTimelineBlockAttributes['alertLevel']>('normal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!timelineTitle.trim()) return;

    onInsert({
      title: timelineTitle.trim(),
      time: timelineTime.trim(),
      description: timelineDesc.trim() || undefined,
      status: timelineStatus,
      windSpeed: windSpeed.trim() || undefined,
      weatherCondition: weatherCondition.trim() || undefined,
      alertLevel,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
            Time
          </label>
          <input
            type="text"
            required
            value={timelineTime}
            onChange={(e) => setTimelineTime(e.target.value)}
            placeholder="14:30"
            className="w-full px-3 py-2 border rounded-xl border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
          />
        </div>
        <div className="col-span-2">
          <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
            Event Title *
          </label>
          <input
            type="text"
            required
            value={timelineTitle}
            onChange={(e) => setTimelineTitle(e.target.value)}
            placeholder="e.g. Task 3 Briefing Completed"
            className="w-full px-3 py-2 border rounded-xl border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
            Status
          </label>
          <select
            value={timelineStatus}
            onChange={(e) =>
              setTimelineStatus(e.target.value as EventTimelineBlockAttributes['status'])
            }
            className="w-full px-3 py-2 border rounded-xl border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
          >
            <option value="scheduled">Scheduled</option>
            <option value="live">Live / In Progress</option>
            <option value="completed">Completed</option>
            <option value="delayed">Delayed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
            Alert Level
          </label>
          <select
            value={alertLevel}
            onChange={(e) =>
              setAlertLevel(e.target.value as EventTimelineBlockAttributes['alertLevel'])
            }
            className="w-full px-3 py-2 border rounded-xl border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
          >
            <option value="normal">Normal</option>
            <option value="advisory">Advisory</option>
            <option value="warning">Warning / Severe</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
            Wind Conditions
          </label>
          <input
            type="text"
            value={windSpeed}
            onChange={(e) => setWindSpeed(e.target.value)}
            placeholder="e.g. 14 knots NW"
            className="w-full px-3 py-2 border rounded-xl border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
            Weather Condition
          </label>
          <input
            type="text"
            value={weatherCondition}
            onChange={(e) => setWeatherCondition(e.target.value)}
            placeholder="e.g. Clear skies, mild thermal"
            className="w-full px-3 py-2 border rounded-xl border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
          />
        </div>
      </div>

      <div>
        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
          Description / Notes
        </label>
        <textarea
          rows={2}
          value={timelineDesc}
          onChange={(e) => setTimelineDesc(e.target.value)}
          placeholder="Detailed flight note or race standings update..."
          className="w-full px-3 py-2 border rounded-xl border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium resize-none"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl cursor-pointer"
        >
          Insert Timeline Update
        </button>
      </div>
    </form>
  );
}
