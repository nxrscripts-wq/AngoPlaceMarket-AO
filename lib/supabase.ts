import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cpywwtagycbcrqsnpqra.supabase.co';
const supabaseAnonKey = 'sb_publishable_78KbBsIs-Tea3hIrJBmxXQ_O5cJqPIS';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
