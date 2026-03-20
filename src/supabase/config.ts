import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cbafffhtnmngimzorgws.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiYWZmZmh0bm1uZ2ltem9yZ3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTQ2NDIsImV4cCI6MjA4OTU5MDY0Mn0.57Ihws_KFMbMjDUxgXujsdwQ22Sm5g3nXgxucX0lNxk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
