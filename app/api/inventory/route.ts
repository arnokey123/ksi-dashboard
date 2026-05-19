import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server';

// PASTE YOUR ACTUAL KEYS HERE
const supabaseUrl = 'https://gxozredpgczirobxyrve.supabase.co'
const supabaseKey = 'sb_publishable_VvO8Coqcn3HnL9p6DSE-YQ_mYhtENYa'
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

    if (!items || items.length === 0) {
      return corsResponse(NextResponse.json({ error: 'No items' }, { status: 400 }));
    }

    // Clean items: Remove 'id' and ensure types are correct
    const cleanItems = items.map((item: any) => ({
      name: String(item.name),
      price: Number(item.price) || 0,
      stock: Number(item.stock) || 0,
      unit: String(item.unit || 'each')
    }));

    const { error } = await supabase
      .from('inventory')
      .upsert(cleanItems, { onConflict: 'name' });

    if (error) {
      console.error("Supabase error:", error);
      return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }));
    }

    return corsResponse(NextResponse.json({ success: true }));
  } catch (err) {
    console.error("Server error:", err);
    return corsResponse(NextResponse.json({ error: 'Server failed' }, { status: 500 }));
  }
}

export async function GET() {
  const { data, error } = await supabase.from('inventory').select('*');
  if (error) return corsResponse(NextResponse.json([], { status: 500 }));
  return corsResponse(NextResponse.json(data));
}
