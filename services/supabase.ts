/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a dummy client that doesn't crash if keys are missing
const createSafeClient = () => {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase credentials missing. App will run in local-only mode.');

        // Return a dummy object that mimics the Supabase client structure to avoid crashes
        return {
            auth: {
                getSession: async () => ({ data: { session: null }, error: null }),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
                signInWithOAuth: async () => ({ error: new Error('Supabase not configured') }),
                signOut: async () => ({ error: null }),
            },
            from: () => ({
                select: () => ({
                    eq: () => ({
                        order: () => ({
                            then: (cb: any) => cb({ data: [], error: null }),
                        }),
                        single: () => ({
                            then: (cb: any) => cb({ data: null, error: null }),
                        })
                    }),
                }),
                upsert: () => ({
                    select: () => ({
                        single: () => ({
                            then: (cb: any) => cb({ data: null, error: new Error('Supabase not configured') }),
                        })
                    })
                }),
                delete: () => ({
                    eq: () => ({
                        then: (cb: any) => cb({ error: new Error('Supabase not configured') }),
                    })
                }),
                update: () => ({
                    eq: () => ({
                        then: (cb: any) => cb({ error: new Error('Supabase not configured') }),
                    })
                })
            }),
        } as any;
    }

    return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createSafeClient();
