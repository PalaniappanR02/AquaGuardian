import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Type helpers
export type SensorData = {
  id: number;
  sensor_id: string;
  sensor_type: 'flood' | 'pressure' | 'gas' | 'flow';
  value: number;
  unit: string;
  timestamp: string;
  location_id: string;
};

export type Complaint = {
  id: string;
  user_id: string;
  category: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string;
  role: 'admin' | 'operator' | 'viewer';
  updated_at: string;
};
