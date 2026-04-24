import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server';

// CONFIG (Use your existing keys)
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

// GET: Fetch Inventory
export async function GET() {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .order('name');

  if (error) return corsResponse(NextResponse.json([], { status: 500 }));
  return corsResponse(NextResponse.json(data));
}

// POST: Sync/Update Inventory
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items } = body;

    // Upsert: Update if exists, insert if new.
    // We match by 'name' because names are unique in your app.
    const { error } = await supabase
      .from('inventory')
      .upsert(items, { onConflict: 'name' });

    if (error) throw error;
    return corsResponse(NextResponse.json({ success: true }));
  } catch (error) {
    return corsResponse(NextResponse.json({ error: 'Failed to sync inventory' }, { status: 500 }));
  }
}







