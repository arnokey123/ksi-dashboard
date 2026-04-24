import { NextResponse } from 'next/server';

// Temporary storage (Note: This will reset if Vercel sleeps. For permanence, use Supabase/GitHub)
let cachedSales: any[] = [];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sales } = body;
    
    // Add new sales to cache
    cachedSales = [...cachedSales, ...sales];
    
    return NextResponse.json({ success: true, count: sales.length });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(cachedSales);
}
