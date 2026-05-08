import { Notification } from '@/lib/api';

export const TYPE_WEIGHT: Record<Notification['Type'], number> = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

export function getPriorityNotifications(
  notifications: Notification[],
  topN: number = 10
): Notification[] {
  return [...notifications]
    .sort((a, b) => {
      const weightDiff = TYPE_WEIGHT[b.Type] - TYPE_WEIGHT[a.Type];
      if (weightDiff !== 0) return weightDiff;
      return new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime();
    })
    .slice(0, topN);
}
