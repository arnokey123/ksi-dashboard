import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server';

// --- PASTE YOUR REAL KEYS BELOW ---
const supabaseUrl = 'https://gxozredpgczirobxyrve.supabase.co' // <-- Put your URL
const supabaseKey = 'sb_publishable_VvO8Coqcn3HnL9p6DSE-YQ_mYhtENYa' // <-- Put your Key
const supabase = createClient(supabaseUrl, supabaseKey)
// ----------------------------------

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
    // We expect { items: [...] } from Java
    const rawItems = body.items || [];

    // Clean the items to match database columns
    const cleanItems = rawItems.map((item: any) => ({
      name: item.name,
      price: Number(item.price) || 0,
      stock: Number(item.stock) || 0,
      unit: item.unit
    }));

    // Insert into Database
    const { error } = await supabase
      .from('inventory')
      .upsert(cleanItems, { onConflict: 'name' });

    if (error) {
      // This prints the specific error to Vercel logs
      console.error("Supabase Error:", error);
      return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }));
    }

    return corsResponse(NextResponse.json({ success: true }));
    
  } catch (e) {
    console.error("Server Crash:", e);
    return corsResponse(NextResponse.json({ error: 'Server failed' }, { status: 500 }));
  }
}

export async function GET() {
  const { data, error } = await supabase.from('inventory').select('*');
  if (error) return corsResponse(NextResponse.json([], { status: 500 }));
  return corsResponse(NextResponse.json(data));
}








