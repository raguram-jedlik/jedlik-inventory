import { NextResponse } from 'next/server';
import { searchInventory } from '@/lib/sheets-service';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const field = searchParams.get('field') || 'all';

    const results = await searchInventory(q, field);
    return NextResponse.json(results);
  } catch (error) {
    console.error('GET /api/inventory/search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
