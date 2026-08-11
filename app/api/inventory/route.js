import { NextResponse } from 'next/server';
import { getAllInventory, getInventoryByLocation, addNewInventoryItem } from '@/lib/sheets-service';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');

    if (location) {
      const items = await getInventoryByLocation(location);
      return NextResponse.json(items);
    }

    const items = await getAllInventory();
    return NextResponse.json(items);
  } catch (error) {
    console.error('GET /api/inventory error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const result = await addNewInventoryItem(data);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('POST /api/inventory error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
