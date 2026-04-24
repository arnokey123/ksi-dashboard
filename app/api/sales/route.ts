import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server';

// 1. CONFIGURATION (Paste your keys here)
const supabaseUrl = 'https://gxozredpgczirobxyrve.supabase.co'
const supabaseKey = 'sb_publishable_VvO8Coqcn3HnL9p6DSE-YQ_mYhtENYa'
const supabase = createClient(supabaseUrl, supabaseKey)

// 2. LOGIC: Handle CORS (Permissions)
function corsResponse(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return corsResponse(response);
}

// 3. LOGIC: Save Sales (When App sends data)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sales } = body;

    // Insert each sale into the 'sales' table
    // We wrap the sale data in a JSON object
    const inserts = sales.map((s: any) => ({ data: s }));

    const { error } = await supabase
      .from('sales')
      .insert(inserts);

    if (error) {
      console.error("Supabase Insert Error:", error);
      return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }));
    }

    return corsResponse(NextResponse.json({ success: true }));
    
  } catch (error) {
    return corsResponse(NextResponse.json({ error: 'Server error' }, { status: 500 }));
  }
}

// 4. LOGIC: Get Sales (When Dashboard loads)
export async function GET() {
  try {
    // Fetch all sales, newest first
    const { data, error } = await supabase
      .from('sales')
      .select('data, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return corsResponse(NextResponse.json([], { status: 500 }));
    }

    // Extract just the data part for the frontend
    const flatData = data.map((d: any) => d.data);
    return corsResponse(NextResponse.json(flatData));
    
  } catch (error) {
    return corsResponse(NextResponse.json([], { status: 500 }));
  }
}
