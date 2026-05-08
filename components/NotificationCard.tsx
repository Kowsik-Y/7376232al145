'use client';

import { Notification } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  notification: Notification;
  isPriority?: boolean;
  rank?: number;
}

const TYPE_CONFIG: Record<
  Notification['Type'],
  { dot: string; badge: string }
> = {
  Placement: {
    dot: 'bg-green-400',
    badge: 'bg-green-100 text-green-700',
  },
  Result: {
    dot: 'bg-blue-400',
    badge: 'bg-blue-100 text-blue-700',
  },
  Event: {
    dot: 'bg-purple-400',
    badge: 'bg-purple-100 text-purple-700 ',
  },
};

export default function NotificationCard({
  notification,
  isPriority = false,
  rank,
}: Props) {
  const cfg = TYPE_CONFIG[notification.Type];

  return (
    <Card
      className='rounded-r-lg shadow-none'
    >
      <CardContent className="px-4 py-3">
        <div className="flex items-start gap-3">
          {isPriority && rank !== undefined && (
            <span className="mt-0.5 text-xs font-semibold text-zinc-400 w-4 shrink-0 text-right">
              {rank}.
            </span>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className={'text-sm text-zinc-800  leading-snug'}>
                {notification.Message}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={'text-[10px] px-1.5 py-0 h-4 border-0' + cfg.badge}>
                {notification.Type}
              </Badge>
              <span className="text-xs text-zinc-400">{notification.Timestamp}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
