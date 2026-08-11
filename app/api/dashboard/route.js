import { NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/dashboard-service';

export async function GET() {
  try {
    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
