import { NextResponse } from 'next/server';
import { getAlerts } from '@/lib/notification-service';

export async function GET() {
  try {
    const alerts = await getAlerts();
    return NextResponse.json(alerts);
  } catch (error) {
    console.error('GET /api/alerts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
