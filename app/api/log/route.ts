import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_LOG_URL = `${process.env.EVALUATION_URL}/evaluation-service/logs`;

const TOKEN =
  process.env.EVALUATION_AUTH_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(EXTERNAL_LOG_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    return NextResponse.json({ ok: res.ok }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
