import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server';

// CONFIGURATION (Paste your keys here)
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

    if (!items || !Array.isArray(items)) {
      return corsResponse(NextResponse.json({ error: 'Invalid data format' }, { status: 400 }));
    }

    // Prepare items for database
    const inserts = items.map((it: any) => ({
      name: it.name,
      price: it.price,
      stock: it.stock,
      unit: it.unit
    }));

    // Upsert: Update if name exists, Insert if new
    const { error } = await supabase
      .from('inventory')
      .upsert(inserts, { onConflict: 'name' });

    if (error) {
      console.error("Supabase Inventory Error:", error);
      return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }));
    }

    return corsResponse(NextResponse.json({ success: true }));
    
  } catch (error) {
    console.error("Server Error:", error);
    return corsResponse(NextResponse.json({ error: 'Server error' }, { status: 500 }));
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('name');

    if (error) throw error;
    return corsResponse(NextResponse.json(data));
  } catch (error) {
    return corsResponse(NextResponse.json([], { status: 500 }));
  }
}
