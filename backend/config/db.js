import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Missing Supabase configuration in backend/.env');
}

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function initializeDatabase() {
  if (!supabase) {
    console.log('⚠️ Supabase client not initialized. Check backend/.env');
    return;
  }
  try {
    const { error } = await supabase.from('decision_models').select('id').limit(1);
    if (error) {
      console.warn('⚠️ Supabase tables warning:', error.message);
    } else {
      console.log('✅ Connected to Supabase successfully!');
    }
  } catch (err) {
    console.warn('⚠️ Supabase connection check warning:', err.message);
  }
}
