'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import NotificationCard from '@/components/NotificationCard';
import { fetchNotifications, Notification } from '@/lib/api';
import { getPriorityNotifications } from '@/lib/priority_inbox';
import { Log } from '@/loggingMiddleware';
import { RefreshCw, ChevronLeft, ChevronRight, Bell } from 'lucide-react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const LIMIT = 10;
type FilterType = 'All' | 'Placement' | 'Result' | 'Event';

export default function Home() {
  const [allNotifs, setAllNotifs] = useState<Notification[]>([]);
  const [allLoading, setAllLoading] = useState(true);
  const [allError, setAllError] = useState<string | null>(null);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterType>('All');

  const [priorityNotifs, setPriorityNotifs] = useState<Notification[]>([]);
  const [priorityLoading, setPriorityLoading] = useState(true);
  const [priorityError, setPriorityError] = useState<string | null>(null);
  const [topN, setTopN] = useState(10);

  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem('campus_seen');
      if (raw) setSeenIds(new Set(JSON.parse(raw)));
    } catch { console.log("Error") }
  }, []);

  const markSeen = useCallback((items: Notification[]) => {
    setSeenIds(prev => {
      const next = new Set(prev);
      items.forEach(n => next.add(n.ID));
      try { localStorage.setItem('campus_seen', JSON.stringify([...next])); } catch {
        console.log("Error")
      }
      return next;
    });
  }, []);

  const loadAll = useCallback(async () => {
    setAllLoading(true);
    setAllError(null);
    setTokenExpired(false);
    await Log('frontend', 'info', 'page', `load all page=${page} filter=${filter}`);
    const result = await fetchNotifications({ limit: LIMIT, page, notificationType: filter });
    setAllNotifs(result.notifications);
    if (result.tokenExpired) setTokenExpired(true);
    else if (result.error) setAllError(result.error);
    setAllLoading(false);
    if (result.notifications.length) setTimeout(() => markSeen(result.notifications), 1200);
  }, [page, filter, markSeen]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const loadPriority = useCallback(async () => {
    setPriorityLoading(true);
    setPriorityError(null);
    await Log('frontend', 'info', 'page', `load priority topN=${topN}`);

    const [p1, p2, p3] = await Promise.all([
      fetchNotifications({ limit: 10, page: 1 }),
      fetchNotifications({ limit: 10, page: 2 }),
      fetchNotifications({ limit: 10, page: 3 }),
    ]);

    if (p1.tokenExpired) { setPriorityError('token_expired'); setPriorityLoading(false); return; }

    const seen = new Set<string>();
    const merged: Notification[] = [];
    for (const r of [p1, p2, p3]) {
      for (const n of r.notifications) {
        if (!seen.has(n.ID)) { seen.add(n.ID); merged.push(n); }
      }
    }

    setPriorityNotifs(getPriorityNotifications(merged, topN));
    if (!merged.length) setPriorityError(p1.error ?? 'No notifications found.');
    setPriorityLoading(false);
    if (merged.length) setTimeout(() => markSeen(merged), 1200);
  }, [topN, markSeen]);

  const prevTopN = useRef(topN);
  useEffect(() => {
    if (prevTopN.current !== topN) { prevTopN.current = topN; loadPriority(); }
  }, [topN, loadPriority]);

  const priorityLoaded = useRef(false);
  useEffect(() => {
    if (!priorityLoaded.current) { priorityLoaded.current = true; loadPriority(); }
  }, [loadPriority]);

  return (
    <div className='pb-20'>
      <div className="border-b bg-white sticky top-0 z-10 ">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900  text-white ">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-zinc-900  leading-tight">
              Notifications
            </h1>
          </div>
        </div>
      </div>
      {(tokenExpired || priorityError === 'token_expired') && (
        <div className="mx-auto max-w-2xl px-4 mt-6">
          <div className="rounded-lg bg-amber-50 border border-amber-200  px-4 py-3 text-sm text-amber-700">
            <span className="font-medium">Token expired.</span>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-2xl px-4 mt-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="priority">Priority Inbox</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="flex items-center justify-between">
              <Select value={filter} onValueChange={(val: FilterType) => { setFilter(val); setPage(1); }}>
                <SelectTrigger className="w-35 h-8 text-xs">
                  <SelectValue placeholder="Filter Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  <SelectItem value="Placement">Placement</SelectItem>
                  <SelectItem value="Result">Result</SelectItem>
                  <SelectItem value="Event">Event</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" className="h-8 w-8" onClick={loadAll}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>

            {allError && !tokenExpired && (
              <p className="text-sm text-red-500">{allError}</p>
            )}

            {allLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : allNotifs.length === 0 ? (
              <p className="text-sm text-zinc-400 py-10 text-center">Nothing here yet.</p>
            ) : (
              <div className="space-y-2">
                {allNotifs.map(n => (
                  <NotificationCard key={n.ID} notification={n} />
                ))}
              </div>
            )}

            {!allLoading && allNotifs.length > 0 && (
              <div className="flex items-center gap-3 justify-center pt-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-zinc-500">Page {page}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(p => p + 1)}
                  disabled={allNotifs.length < LIMIT}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="priority" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Show top</span>
                <Select value={String(topN)} onValueChange={(v) => setTopN(Number(v))}>
                  <SelectTrigger className="w-20 h-8 text-xs">
                    <SelectValue placeholder="Top N" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" size="icon" className="h-8 w-8" onClick={loadPriority}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>

            {priorityError && priorityError !== 'token_expired' && (
              <p className="text-sm text-red-500">{priorityError}</p>
            )}

            {priorityLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : priorityNotifs.length === 0 ? (
              <p className="text-sm text-zinc-400 py-10 text-center">Nothing here yet.</p>
            ) : (
              <div className="space-y-2">
                {priorityNotifs.map((n, i) => (
                  <NotificationCard
                    key={n.ID}
                    notification={n}
                    isPriority
                    rank={i + 1}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
