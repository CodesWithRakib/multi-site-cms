'use client';

import React, { useState } from 'react';
import type { DestinationInfoBlockAttributes } from '../../extensions/destination-info-block';

export interface DestinationBlockModalProps {
  onClose: () => void;
  onInsert: (attrs: DestinationInfoBlockAttributes) => void;
}

export function DestinationBlockModal({ onClose, onInsert }: DestinationBlockModalProps) {
  const [destination, setDestination] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [bestSeason, setBestSeason] = useState('');
  const [elevation, setElevation] = useState('');
  const [highlightsInput, setHighlightsInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!destination.trim()) return;

    const highlights = highlightsInput
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    onInsert({
      destination: destination.trim(),
      country: country.trim(),
      region: region.trim() || undefined,
      bestSeason: bestSeason.trim() || undefined,
      elevation: elevation.trim() || undefined,
      highlights: highlights.length > 0 ? highlights : undefined,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
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
          className="w-full px-3 py-2 border rounded-xl border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
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
            className="w-full px-3 py-2 border rounded-xl border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
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
            className="w-full px-3 py-2 border rounded-xl border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
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
            className="w-full px-3 py-2 border rounded-xl border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
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
            className="w-full px-3 py-2 border rounded-xl border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
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
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl cursor-pointer"
        >
          Insert Destination Block
        </button>
      </div>
    </form>
  );
}
