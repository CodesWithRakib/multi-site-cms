'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PublicArticleSummary } from '@multi-site-cms/types';
import { SITE_KEY } from '@/lib/api';

export type RealtimeStatus = 'connecting' | 'connected' | 'reconnecting' | 'fallback';

export interface RealtimeMessage {
  id: string;
  type: string;
  siteKey: string;
  publicationId: string;
  postId: string;
  slug: string;
  title: string;
  publishedAt: string;
  alertLevel?: string;
  windConditions?: string;
  weather?: string;
  timestamp: number;
}

interface UseRealtimeStreamOptions {
  initialArticles: PublicArticleSummary[];
  onNewArticle?: (article: PublicArticleSummary) => void;
  maxTimelineItems?: number;
}

export function useRealtimeStream({
  initialArticles,
  onNewArticle,
  maxTimelineItems = 50,
}: UseRealtimeStreamOptions) {
  const [articles, setArticles] = useState<PublicArticleSummary[]>(initialArticles);
  const [status, setStatus] = useState<RealtimeStatus>('connecting');
  const [lastPing, setLastPing] = useState<Date | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');

  const lastEventIdRef = useRef<string | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingWatchdogRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackPollRef = useRef<NodeJS.Timeout | null>(null);
  const connectSSERef = useRef<() => void>(() => {});

  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1').replace(
    /\/+$/,
    '',
  );

  // Stable article deduplication and sorting
  const mergeArticles = useCallback(
    (newItems: PublicArticleSummary[]) => {
      setArticles((prev) => {
        const map = new Map<string, PublicArticleSummary>();
        // Add existing articles
        for (const item of prev) {
          map.set(item.id || item.slug, item);
        }
        // Merge incoming articles
        for (const item of newItems) {
          map.set(item.id || item.slug, item);
        }

        // Sort descending by publishedAt, secondary id
        return Array.from(map.values())
          .sort((a, b) => {
            const timeA = new Date(a.publishedAt).getTime();
            const timeB = new Date(b.publishedAt).getTime();
            if (timeB !== timeA) return timeB - timeA;
            return b.slug.localeCompare(a.slug);
          })
          .slice(0, maxTimelineItems);
      });
    },
    [maxTimelineItems],
  );

  // Authoritative REST verification of an incoming published update
  const fetchAuthoritativeUpdate = useCallback(
    async (slug: string) => {
      try {
        const res = await fetch(
          `${apiBaseUrl}/public/sites/${SITE_KEY}/posts/${encodeURIComponent(slug)}`,
          {
            headers: { Accept: 'application/json' },
          },
        );
        if (!res.ok) return null;
        const json = (await res.json()) as { data: PublicArticleSummary };
        return json.data || null;
      } catch (err) {
        console.warn(`[Air Sports Realtime] Failed to verify post ${slug}:`, err);
        return null;
      }
    },
    [apiBaseUrl],
  );

  // Query missed updates when reconnecting
  const fetchMissedUpdates = useCallback(
    async (sinceId: string) => {
      try {
        const res = await fetch(
          `${apiBaseUrl}/realtime/${SITE_KEY}/missed-updates?lastEventId=${encodeURIComponent(sinceId)}`,
          { headers: { Accept: 'application/json' } },
        );
        if (!res.ok) return [];
        const json = (await res.json()) as { items: RealtimeMessage[] };
        return json.items || [];
      } catch (err) {
        console.warn('[Air Sports Realtime] Failed to fetch missed updates:', err);
        return [];
      }
    },
    [apiBaseUrl],
  );

  // Fallback polling for when SSE is unavailable or repeatedly failing
  const executeFallbackPoll = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/public/sites/${SITE_KEY}/posts?limit=10`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const json = (await res.json()) as { data: PublicArticleSummary[] };
        if (json.data && json.data.length > 0) {
          mergeArticles(json.data);
        }
      }
    } catch {
      // Ignore background poll errors
    }
  }, [apiBaseUrl, mergeArticles]);

  // Connect to SSE stream
  const connectSSE = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Clean up any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const lastId = lastEventIdRef.current;
    const streamUrl = `${apiBaseUrl}/realtime/${SITE_KEY}/stream${
      lastId ? `?lastEventId=${encodeURIComponent(lastId)}` : ''
    }`;

    setStatus((prev) =>
      prev === 'fallback'
        ? 'fallback'
        : reconnectAttemptsRef.current > 0
          ? 'reconnecting'
          : 'connecting',
    );

    try {
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setStatus('connected');

        // Stop fallback poll if it was running
        if (fallbackPollRef.current) {
          clearInterval(fallbackPollRef.current);
          fallbackPollRef.current = null;
        }

        // Backfill missed updates if reconnected
        if (lastId) {
          fetchMissedUpdates(lastId).then(async (missedList) => {
            for (const m of missedList) {
              lastEventIdRef.current = m.id;
              const authoritative = await fetchAuthoritativeUpdate(m.slug);
              if (authoritative) {
                mergeArticles([authoritative]);
              }
            }
          });
        }
      };

      // Handle custom event types
      es.addEventListener('system.connected', () => {
        setStatus('connected');
        setLastPing(new Date());
      });

      es.addEventListener('ping', () => {
        setLastPing(new Date());
      });

      es.addEventListener('air_sports.update.published', async (e: MessageEvent) => {
        try {
          const raw = JSON.parse(e.data) as RealtimeMessage;
          if (raw.id) lastEventIdRef.current = raw.id;

          // Verify with authoritative REST API before displaying
          const verified = await fetchAuthoritativeUpdate(raw.slug);
          if (verified) {
            mergeArticles([verified]);
            onNewArticle?.(verified);
            setLiveAnnouncement(`Live update: ${verified.title}`);
          }
        } catch (err) {
          console.warn('[Air Sports Realtime] Error processing live update event:', err);
        }
      });

      es.addEventListener('publication.published', async (e: MessageEvent) => {
        try {
          const raw = JSON.parse(e.data) as RealtimeMessage;
          if (raw.id) lastEventIdRef.current = raw.id;

          const verified = await fetchAuthoritativeUpdate(raw.slug);
          if (verified) {
            mergeArticles([verified]);
            onNewArticle?.(verified);
            setLiveAnnouncement(`New publication: ${verified.title}`);
          }
        } catch (err) {
          console.warn('[Air Sports Realtime] Error processing publication event:', err);
        }
      });

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;

        reconnectAttemptsRef.current += 1;
        const attempts = reconnectAttemptsRef.current;

        if (attempts >= 5) {
          // Transition to fallback polling mode after 5 consecutive failures
          setStatus('fallback');
          if (!fallbackPollRef.current) {
            fallbackPollRef.current = setInterval(executeFallbackPoll, 60000);
          }
          // Retry connecting SSE after 60s
          reconnectTimeoutRef.current = setTimeout(() => connectSSERef.current(), 60000);
        } else {
          setStatus('reconnecting');
          // Exponential backoff with jitter: 2s, 4s, 8s, 16s, 30s max
          const delay = Math.min(30000, 2000 * Math.pow(2, attempts - 1) + Math.random() * 1000);
          reconnectTimeoutRef.current = setTimeout(() => connectSSERef.current(), delay);
        }
      };
    } catch (err) {
      console.warn('[Air Sports Realtime] EventSource initialization failed:', err);
      setStatus('fallback');
      if (!fallbackPollRef.current) {
        fallbackPollRef.current = setInterval(executeFallbackPoll, 60000);
      }
    }
  }, [
    apiBaseUrl,
    fetchAuthoritativeUpdate,
    fetchMissedUpdates,
    mergeArticles,
    onNewArticle,
    executeFallbackPoll,
  ]);

  useEffect(() => {
    connectSSERef.current = connectSSE;
  }, [connectSSE]);

  // Window visibility listener for instant refresh when returning to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (status === 'fallback' || !eventSourceRef.current) {
          connectSSERef.current();
          executeFallbackPoll();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connectSSE, executeFallbackPoll, status]);

  // Watchdog checking heartbeat pings (if no ping in 60s, reconnect)
  useEffect(() => {
    pingWatchdogRef.current = setInterval(() => {
      if (status === 'connected' && lastPing) {
        const elapsedMs = Date.now() - lastPing.getTime();
        if (elapsedMs > 60000) {
          console.warn('[Air Sports Realtime] No ping heartbeat received in 60s. Reconnecting...');
          connectSSE();
        }
      }
    }, 15000);

    return () => {
      if (pingWatchdogRef.current) clearInterval(pingWatchdogRef.current);
    };
  }, [connectSSE, lastPing, status]);

  // Mount/Unmount lifecycle
  useEffect(() => {
    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingWatchdogRef.current) clearInterval(pingWatchdogRef.current);
      if (fallbackPollRef.current) clearInterval(fallbackPollRef.current);
    };
  }, [connectSSE]);

  return {
    articles,
    status,
    lastPing,
    liveAnnouncement,
    refreshManually: executeFallbackPoll,
  };
}
