// Simple test to check database connection
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vdgqngppsaoagsojdbdb.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_dq6rv_j7e_HiI4qwX7fZyg_6l2cpwcI';

export default async function testConnection() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('tickets')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database connection error:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (err) {
    console.error('Connection test error:', err);
    return { success: false, error: err };
  }
}
