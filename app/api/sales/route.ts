import { NextResponse } from 'next/server';

// Temporary storage
let cachedSales: any[] = [];

// Helper function to add CORS headers
function corsResponse(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*'); // Allow all origins (App, Browser, etc.)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Handle OPTIONS request (The "Handshake" check by browsers/apps)
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return corsResponse(response);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sales } = body;
    
    cachedSales = [...cachedSales, ...sales];
    
    const response = NextResponse.json({ success: true, count: sales.length });
    return corsResponse(response);
  } catch (error) {
    const response = NextResponse.json({ error: 'Server error' }, { status: 500 });
    return corsResponse(response);
  }
}

export async function GET() {
  const response = NextResponse.json(cachedSales);
  return corsResponse(response);
}
