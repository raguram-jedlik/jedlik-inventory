import { NextResponse } from 'next/server';
import { getAllLocations, addNewLocation } from '@/lib/sheets-service';
import { generateQRCodeForLocation } from '@/lib/qr-service';

export async function GET() {
  try {
    const locations = await getAllLocations();
    return NextResponse.json(locations);
  } catch (error) {
    console.error('GET /api/locations error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const result = await addNewLocation(data);

    // Generate QR code if location was added successfully
    if (result.success) {
      try {
        await generateQRCodeForLocation(data.locationId.trim().toUpperCase());
        result.message += ' QR code generated.';
      } catch (qrErr) {
        console.warn('QR generation failed:', qrErr);
      }
    }

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('POST /api/locations error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
