import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server';

// CONFIG
const supabaseUrl = 'https://gxozredpgczirobxyrve.supabase.co'
const supabaseKey = 'sb_publishable_VvO8Coqcn3HnL9p6DSE-YQ_mYhtENYa'
const supabase = createClient(supabaseUrl, supabaseKey)

function corsResponse(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS() {
  return corsResponse(new NextResponse(null, { status: 204 }));
}

// GET: Fetch all sales (Returning ID is crucial for management)
export async function GET() {
  const { data, error } = await supabase
    .from('sales')
    .select('id, data, created_at')
    .order('created_at', { ascending: false });

  if (error) return corsResponse(NextResponse.json([], { status: 500 }));
  
  // Return ID along with data
  const mappedData = data.map((d: any) => ({ id: d.id, ...d.data }));
  return corsResponse(NextResponse.json(mappedData));
}

// POST: Sync (Upsert)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sales } = body;
    const inserts = sales.map((s: any) => ({ data: s, sale_time: s.time }));
    const { error } = await supabase.from('sales').upsert(inserts, { onConflict: 'sale_time' });
    if (error) throw error;
    return corsResponse(NextResponse.json({ success: true }));
  } catch (error) {
    return corsResponse(NextResponse.json({ error: 'Server error' }, { status: 500 }));
  }
}

// PUT: Edit a specific sale
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    const { newData } = body; // Expect { newData: { title: "...", items: [...] } }

    if (!id) return corsResponse(NextResponse.json({ error: 'ID required' }, { status: 400 }));

    const { error } = await supabase
      .from('sales')
      .update({ data: newData })
      .eq('id', id);

    if (error) throw error;
    return corsResponse(NextResponse.json({ success: true }));
  } catch (error) {
    return corsResponse(NextResponse.json({ error: 'Update failed' }, { status: 500 }));
  }
}






// ... existing imports and config ...

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const time = searchParams.get('time');

    // If 'time' is 'all', delete everything
    if (time === 'all') {
      const { error } = await supabase.from('sales').delete().neq('id', 0); // Delete all
      if (error) throw error;
      return corsResponse(NextResponse.json({ success: true }));
    }

    // Otherwise delete specific sale
    if (!time) return corsResponse(NextResponse.json({ error: 'Time ID required' }, { status: 400 }));
    
    const { error } = await supabase.from('sales').delete().eq('sale_time', time);
    if (error) throw error;

    return corsResponse(NextResponse.json({ success: true }));
  } catch (error) {
    return corsResponse(NextResponse.json({ error: 'Delete failed' }, { status: 500 }));
  }
}

  



