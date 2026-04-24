import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server';

const supabaseUrl = 'https://gxozredpgczirobxyrve.supabase.co'
const supabaseKey = 'sb_publishable_VvO8Coqcn3HnL9p6DSE-YQ_mYhtENYa'
const supabase = createClient(supabaseUrl, supabaseKey)

export async function DELETE() {
  try {
    // Delete all rows
    const { error } = await supabase.from('sales').delete().neq('id', 0); // neq 0 is a trick to delete all
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear' }, { status: 500 });
  }
}


