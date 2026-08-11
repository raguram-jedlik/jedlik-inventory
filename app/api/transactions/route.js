import { NextResponse } from 'next/server';
import { getRecentTransactions } from '@/lib/sheets-service';
import { processTransaction, getItemTransactionHistory, getLocationTransactionHistory } from '@/lib/transaction-service';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const locationId = searchParams.get('locationId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (itemId) {
      const history = await getItemTransactionHistory(itemId);
      return NextResponse.json(history);
    }

    if (locationId) {
      const history = await getLocationTransactionHistory(locationId, limit);
      return NextResponse.json(history);
    }

    const transactions = await getRecentTransactions(limit);
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('GET /api/transactions error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const result = await processTransaction(data);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('POST /api/transactions error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
