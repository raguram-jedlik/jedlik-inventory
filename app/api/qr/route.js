import { NextResponse } from 'next/server';
import { getAllQRData, generateAllMissingQRCodes } from '@/lib/qr-service';

export async function GET() {
  try {
    const data = await getAllQRData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/qr error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await generateAllMissingQRCodes();
    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/qr error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
