import { NextResponse } from 'next/server';
import { getAllEmployees, addNewEmployee } from '@/lib/sheets-service';

export async function GET() {
  try {
    const employees = await getAllEmployees();
    return NextResponse.json(employees);
  } catch (error) {
    console.error('GET /api/employees error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const result = await addNewEmployee(data);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('POST /api/employees error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
