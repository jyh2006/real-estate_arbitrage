import { createClient } from '@supabase/supabase-js';

// 따옴표 안의 내용을 메모해두었던 본인의 Supabase 정보로 교체하세요.
const supabaseUrl = 'https://nwzvgiymnboeizwsvtbf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53enZnaXltbmJvZWl6d3N2dGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMDQ3MjAsImV4cCI6MjEwNDc4MDcyMH0.ddcnGZq-ZdvHl61vBd2TrAvcrQY5S_kkkx4wbpaK3uM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
