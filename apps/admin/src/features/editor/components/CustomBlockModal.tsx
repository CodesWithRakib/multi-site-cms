'use client';

import { useState } from 'react';
import type { DestinationInfoBlockAttributes } from '../extensions/destination-info-block';
import type { EventTimelineBlockAttributes } from '../extensions/event-timeline-block';

export type ActiveModalType = 'destination' | 'timeline' | 'link' | 'youtube' | null;

export interface CustomBlockModalProps {
  modalType: ActiveModalType;
  onClose: () => void;
  onInsertDestination: (attrs: DestinationInfoBlockAttributes) => void;
  onInsertTimeline: (attrs: EventTimelineBlockAttributes) => void;
  onInsertLink: (url: string) => void;
  onInsertYoutube: (url: string) => void;
}

export function CustomBlockModal({
  modalType,
  onClose,
  onInsertDestination,
  onInsertTimeline,
  onInsertLink,
  onInsertYoutube,
}: CustomBlockModalProps) {
  // Destination form state
  const [destination, setDestination] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [bestSeason, setBestSeason] = useState('');
  const [elevation, setElevation] = useState('');
  const [highlightsInput, setHighlightsInput] = useState('');

  // Timeline form state
  const [timelineTitle, setTimelineTitle] = useState('');
  const [timelineTime, setTimelineTime] = useState('10:00 AM');
  const [timelineDesc, setTimelineDesc] = useState('');
  const [timelineStatus, setTimelineStatus] =
    useState<EventTimelineBlockAttributes['status']>('scheduled');
  const [windSpeed, setWindSpeed] = useState('');
  const [weatherCondition, setWeatherCondition] = useState('');
  const [alertLevel, setAlertLevel] =
    useState<EventTimelineBlockAttributes['alertLevel']>('normal');

  // Generic url state
  const [urlInput, setUrlInput] = useState('');

  if (!modalType) return null;

  const handleDestinationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;

    const highlights = highlightsInput
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    onInsertDestination({
      destination: destination.trim(),
      country: country.trim(),
      region: region.trim() || undefined,
      bestSeason: bestSeason.trim() || undefined,
      elevation: elevation.trim() || undefined,
      highlights: highlights.length > 0 ? highlights : undefined,
    });
    onClose();
  };

  const handleTimelineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!timelineTitle.trim()) return;

    onInsertTimeline({
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

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    if (modalType === 'link') {
      onInsertLink(urlInput.trim());
    } else if (modalType === 'youtube') {
      onInsertYoutube(urlInput.trim());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {modalType === 'destination' && 'Insert Destination Info Block'}
            {modalType === 'timeline' && 'Insert Event Timeline Update'}
            {modalType === 'link' && 'Add Hyperlink'}
            {modalType === 'youtube' && 'Embed YouTube Video'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
          >
            ×
          </button>
        </div>

        {modalType === 'destination' && (
          <form onSubmit={handleDestinationSubmit} className="space-y-4 pt-4 text-sm">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Destination Name *
              </label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Zermatt & Matterhorn"
                className="w-full px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Country *
                </label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Switzerland"
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Region / Canton
                </label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g. Valais"
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Best Season
                </label>
                <input
                  type="text"
                  value={bestSeason}
                  onChange={(e) => setBestSeason(e.target.value)}
                  placeholder="e.g. June – September"
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Elevation
                </label>
                <input
                  type="text"
                  value={elevation}
                  onChange={(e) => setElevation(e.target.value)}
                  placeholder="e.g. 1,608 m (5,276 ft)"
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Highlights (one per line)
              </label>
              <textarea
                rows={3}
                value={highlightsInput}
                onChange={(e) => setHighlightsInput(e.target.value)}
                placeholder="Gornergrat railway view&#10;Glacier Paradise cable car&#10;Five Lakes trail"
                className="w-full px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
              >
                Insert Destination Block
              </button>
            </div>
          </form>
        )}

        {modalType === 'timeline' && (
          <form onSubmit={handleTimelineSubmit} className="space-y-4 pt-4 text-sm">
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
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
                className="w-full px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700"
              >
                Insert Timeline Update
              </button>
            </div>
          </form>
        )}

        {(modalType === 'link' || modalType === 'youtube') && (
          <form onSubmit={handleUrlSubmit} className="space-y-4 pt-4 text-sm">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {modalType === 'link' ? 'Destination URL *' : 'YouTube Video URL *'}
              </label>
              <input
                type="url"
                required
                autoFocus
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={
                  modalType === 'link'
                    ? 'https://example.com'
                    : 'https://www.youtube.com/watch?v=...'
                }
                className="w-full px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
