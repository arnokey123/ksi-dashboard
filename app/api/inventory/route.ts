import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server';

// 1. CONFIG (Keep your keys here)
const supabaseUrl = 'https://YOUR_PROJECT_ID.supabase.co'
const supabaseKey = 'sb_publishable_YOUR_KEY'
const supabase = createClient(supabaseUrl, supabaseKey)

function corsResponse(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

export async function OPTIONS() {
  return corsResponse(new NextResponse(null, { status: 204 }));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items } = body;

    // 2. CLEAN DATA: Only pick columns that exist in the database
    // This prevents errors if localStorage has extra fields like 'costPrice'
    const cleanItems = items.map((item: any) => ({
      name: String(item.name || 'Unknown'),
      price: Number(item.price) || 0,
      stock: Number(item.stock) || 0,
      unit: String(item.unit || 'each')
    }));

    // 3. UPSERT: Update if exists, insert if new
    const { error } = await supabase
      .from('inventory')
      .upsert(cleanItems, { onConflict: 'name' });

    if (error) {
      console.error("Supabase Error:", error);
      return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }));
    }

    return corsResponse(NextResponse.json({ success: true }));
  } catch (error) {
    console.error("Server Error:", error);
    return corsResponse(NextResponse.json({ error: 'Failed to process inventory' }, { status: 500 }));
  }
}

export async function GET() {
  const { data, error } = await supabase.from('inventory').select('*');
  if (error) return corsResponse(NextResponse.json([], { status: 500 }));
  return corsResponse(NextResponse.json(data));
}
