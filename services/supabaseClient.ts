import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bftzcoofkitmjxfvqdei.supabase.co';
const supabaseKey = 'sb_publishable_ZAnSgAh055eiG7rS4Xzngw_5pucIUC4';

let client;

try {
  client = createClient(supabaseUrl, supabaseKey);
} catch (error) {
  console.error("Supabase client initialization failed:", error);
  // Fallback mock client to prevent app crash
  client = {
    from: () => ({
      select: () => ({ eq: () => ({ single: () => ({ data: null, error: { message: "Supabase not initialized" } }) }) }),
      insert: () => ({ select: () => ({ single: () => ({ data: null, error: { message: "Supabase not initialized" } }) }) }),
      update: () => ({ eq: () => ({ error: { message: "Supabase not initialized" } }) }),
      delete: () => ({ eq: () => ({ error: { message: "Supabase not initialized" } }) }),
      upsert: () => ({ error: { message: "Supabase not initialized" } }),
    }),
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
      signInWithPassword: async () => ({ error: { message: "Supabase not initialized" } }),
      signUp: async () => ({ error: { message: "Supabase not initialized" } }),
      signInWithOAuth: async () => ({ error: { message: "Supabase not initialized" } }),
      signOut: async () => { },
    },
    storage: {
      from: () => ({
        upload: async () => ({ error: { message: "Supabase not initialized" } }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
    rpc: async () => ({ error: { message: "Supabase not initialized" } }),
  } as any;
}

export const supabase = client;
