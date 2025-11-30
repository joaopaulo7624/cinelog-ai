import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Parâmetros do Supabase ausentes. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
