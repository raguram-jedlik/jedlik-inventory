import { NextResponse } from 'next/server';
import { getReportData } from '@/lib/dashboard-service';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'inventory_movement';
    const start = searchParams.get('start') || null;
    const end = searchParams.get('end') || null;

    const data = await getReportData(type, start, end);
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/reports error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
