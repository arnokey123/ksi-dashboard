
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server';

// 1. CONFIGURATION
const supabaseUrl = 'https://gxozredpgczirobxyrve.supabase.co' // Keep your URL
const supabaseKey = 'sb_publishable_VvO8Coqcn3HnL9p6DSE-YQ_mYhtENYa' // Keep your Key
const supabase = createClient(supabaseUrl, supabaseKey)

function corsResponse(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS() {
  return corsResponse(new NextResponse(null, { status: 204 }));
}

// 2. LOGIC: Sync Sales (Ignores Duplicates)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sales } = body;

    // Prepare data: Extract time for unique checking
    const inserts = sales.map((s: any) => ({
      data: s,
      sale_time: s.time // Link the time column
    }));

    // UPSERT: Update if exists, Insert if new. Ignores duplicates!
    const { error } = await supabase
      .from('sales')
      .upsert(inserts, { onConflict: 'sale_time' }); 

    if (error) {
      console.error("Supabase Error:", error);
      return corsResponse(NextResponse.json({ error: error.message }, { status: 500 }));
    }

    return corsResponse(NextResponse.json({ success: true }));
    
  } catch (error) {
    return corsResponse(NextResponse.json({ error: 'Server error' }, { status: 500 }));
  }
}

// 3. LOGIC: Delete a Sale
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const time = searchParams.get('time'); // Get the time ID from URL

    if (!time) return corsResponse(NextResponse.json({ error: 'Time ID required' }, { status: 400 }));

    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('sale_time', time);

    if (error) throw error;

    return corsResponse(NextResponse.json({ success: true }));
  } catch (error) {
    return corsResponse(NextResponse.json({ error: 'Delete failed' }, { status: 500 }));
  }
}

// 4. LOGIC: Get Sales
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('sales')
      .select('data, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    const flatData = data.map((d: any) => d.data);
    return corsResponse(NextResponse.json(flatData));
  } catch (error) {
    return corsResponse(NextResponse.json([], { status: 500 }));
  }
}
