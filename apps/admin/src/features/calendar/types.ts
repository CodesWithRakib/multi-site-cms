import type { PostPublicationItem, PublicationStatus } from '@multi-site-cms/types';

export type CalendarViewMode = 'month' | 'list';

export interface CalendarEvent {
  id: string;
  postId: string;
  publicationId: string;
  siteId: string;
  siteName: string;
  title: string;
  slug: string;
  type: string;
  status: PublicationStatus;
  date: Date;
  publication: PostPublicationItem;
}

export interface CalendarDayCell {
  dayNumber: number;
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

