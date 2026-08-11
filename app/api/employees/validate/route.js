import { NextResponse } from 'next/server';
import { validateEmployee } from '@/lib/sheets-service';

export async function POST(request) {
  try {
    const { employeeCode } = await request.json();
    const result = await validateEmployee(employeeCode);
    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/employees/validate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
