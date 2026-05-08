import { NextRequest, NextResponse } from 'next/server';
import { Log } from '@/loggingMiddleware';

const EVAL_API = `${process.env.EVALUATION_URL}/evaluation-service/notifications`;

const TOKEN =
  process.env.EVALUATION_AUTH_TOKEN;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit');
  const page = searchParams.get('page');
  const notification_type = searchParams.get('notification_type');

  const params = new URLSearchParams();
  if (limit) params.set('limit', limit);
  if (page) params.set('page', page);
  if (notification_type) params.set('notification_type', notification_type);

  const upstreamUrl = params.toString()
    ? `${EVAL_API}?${params.toString()}`
    : EVAL_API;

  await Log('backend', 'info', 'route', `GET /api/notifications -> ${upstreamUrl}`);

  try {
    const res = await fetch(upstreamUrl, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      await Log('backend', 'error', 'route', `Upstream ${res.status}: ${text}`);

      if (res.status === 401) {
        return NextResponse.json(
          {
            error: 'TOKEN_EXPIRED',
            message:
              'TOKEN_EXPIRED',
            notifications: [],
          },
          { status: 401 }
        );
      }

      if (res.status === 400) {
        return NextResponse.json(
          { error: 'Bad request', message: text, notifications: [] },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Upstream error', status: res.status, notifications: [] },
        { status: res.status }
      );
    }

    const data = await res.json();
    await Log(
      'backend',
      'info',
      'route',
      `Returned ${data?.notifications?.length ?? 0} notifications`
    );
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await Log('backend', 'error', 'route', `Fetch exception: ${msg}`);
    return NextResponse.json({ error: 'Internal server error', notifications: [] }, { status: 500 });
  }
}
