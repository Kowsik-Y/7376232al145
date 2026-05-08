import { Log } from '@/loggingMiddleware';

export interface Notification {
  ID: string;
  Type: 'Placement' | 'Result' | 'Event';
  Message: string;
  Timestamp: string;
}

export interface FetchOptions {
  limit?: number;
  page?: number;
  notificationType?: string;
}

export interface FetchResult {
  notifications: Notification[];
  error?: string;
  tokenExpired?: boolean;
}

export async function fetchNotifications(opts: FetchOptions = {}): Promise<FetchResult> {
  const { limit, page, notificationType } = opts;

  const params = new URLSearchParams();
  if (limit) params.set('limit', String(limit));
  if (page) params.set('page', String(page));
  if (notificationType && notificationType !== 'All')
    params.set('notification_type', notificationType);

  const url = `/api/notifications${params.toString() ? '?' + params.toString() : ''}`;

  await Log('frontend', 'info', 'api', `Fetching: ${url}`);

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      const isExpired = res.status === 401 || data?.error === 'TOKEN_EXPIRED';
      const errMsg =
        isExpired
          ? 'TOKEN_EXPIRED'
          : res.status === 400
            ? `Bad request — invalid query parameters (${data?.message ?? res.status})`
            : data?.message ?? `Server error (${res.status})`;
      await Log('frontend', 'error', 'api', `HTTP ${res.status} — ${errMsg}`);
      return { notifications: [], error: errMsg, tokenExpired: isExpired };
    }

    const notifications: Notification[] = data.notifications ?? [];
    await Log('frontend', 'info', 'api', `Received ${notifications.length} notifications`);
    return { notifications };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await Log('frontend', 'error', 'api', `Fetch error: ${msg}`);
    return { notifications: [], error: msg };
  }
}
