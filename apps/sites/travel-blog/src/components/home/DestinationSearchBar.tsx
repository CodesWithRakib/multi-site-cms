'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, DollarSign, LayoutGrid, Search } from 'lucide-react';
import type { PublicCategoryItem } from '@multi-site-cms/types';

interface DestinationSearchBarProps {
  categories: PublicCategoryItem[];
  className?: string;
}

export function DestinationSearchBar({ categories, className = '' }: DestinationSearchBarProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('q', searchTerm.trim());
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedBudget) params.set('budget', selectedBudget);
    if (selectedTime) params.set('time', selectedTime);

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className={`relative z-20 -mt-6 sm:-mt-8 w-full ${className}`}>
      <form
        onSubmit={handleSearch}
        className="rounded-3xl border border-neutral-200/90 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl shadow-xl p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center"
      >
        {/* Search Input */}
        <div className="lg:col-span-4 relative flex items-center px-3 py-2 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/60 focus-within:ring-2 focus-within:ring-emerald-500/30 transition-all">
          <Search className="h-4 w-4 text-muted-foreground shrink-0 mr-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search destinations, travel tips..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
        </div>

        {/* All Categories Dropdown */}
        <div className="lg:col-span-3 relative flex items-center px-3 py-2 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/60 focus-within:ring-2 focus-within:ring-emerald-500/30 transition-all">
          <LayoutGrid className="h-4 w-4 text-emerald-500 shrink-0 mr-2" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Category Filter"
            className="w-full bg-transparent text-xs sm:text-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug} className="dark:bg-neutral-900">
                {cat.name} ({cat.postCount})
              </option>
            ))}
          </select>
        </div>

        {/* Any Budget Dropdown */}
        <div className="lg:col-span-2 relative flex items-center px-3 py-2 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/60 focus-within:ring-2 focus-within:ring-emerald-500/30 transition-all">
          <DollarSign className="h-4 w-4 text-amber-500 shrink-0 mr-1.5" />
          <select
            value={selectedBudget}
            onChange={(e) => setSelectedBudget(e.target.value)}
            aria-label="Budget Filter"
            className="w-full bg-transparent text-xs sm:text-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring cursor-pointer"
          >
            <option value="">Any Budget</option>
            <option value="budget" className="dark:bg-neutral-900">$ Budget Friendly</option>
            <option value="moderate" className="dark:bg-neutral-900">$$ Moderate Standard</option>
            <option value="luxury" className="dark:bg-neutral-900">$$$ Luxury Escapes</option>
          </select>
        </div>

        {/* Any Time Dropdown */}
        <div className="lg:col-span-2 relative flex items-center px-3 py-2 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/60 focus-within:ring-2 focus-within:ring-emerald-500/30 transition-all">
          <Calendar className="h-4 w-4 text-blue-500 shrink-0 mr-1.5" />
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            aria-label="Season and Time Filter"
            className="w-full bg-transparent text-xs sm:text-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring cursor-pointer"
          >
            <option value="">Any Time</option>
            <option value="spring" className="dark:bg-neutral-900">🌸 Spring (Mar–May)</option>
            <option value="summer" className="dark:bg-neutral-900">☀️ Summer (Jun–Aug)</option>
            <option value="autumn" className="dark:bg-neutral-900">🍂 Autumn (Sep–Nov)</option>
            <option value="winter" className="dark:bg-neutral-900">❄️ Winter (Dec–Feb)</option>
          </select>
        </div>

        {/* Search Submit Button */}
        <div className="lg:col-span-1 flex justify-end">
          <button
            type="submit"
            aria-label="Execute search"
            className="w-full lg:w-auto h-10 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
          >
            <Search className="h-4 w-4" />
            <span className="lg:hidden">Search</span>
          </button>
        </div>
      </form>
    </div>
  );
}

