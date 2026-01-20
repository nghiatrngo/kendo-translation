
import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

export async function GET() {
    try {
        // Try to use Service Role Key to bypass RLS for debugging
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        let supabaseAdmin;
        
        if (serviceKey && url) {
            const { createClient: createClientJs } = require('@supabase/supabase-js');
            supabaseAdmin = createClientJs(url, serviceKey, {
                auth: { persistSession: false }
            });
        } else {
             supabaseAdmin = await createClient(); // Fallback to standard
        }

        // 1. Check Agent Logs
        const { count: logCount, error: logError } = await supabaseAdmin
            .from('agent_logs')
            .select('*', { count: 'exact', head: true });
            
        // 2. Check Translation Memory (Japanese Search)
        const { data: tmJa, error: tmJaError } = await supabaseAdmin
            .from('translation_memory')
            .select('id, source_text, target_text')
            .limit(3);

        // 3. Check Terminology (Bypass RLS)
        const { data: termSample, error: termError } = await supabaseAdmin
            .from('terminology')
            .select('*')
            .limit(3);

        return NextResponse.json({
            usingServiceKey: !!serviceKey,
            agentLogs: { count: logCount, error: logError?.message },
            tm: { 
                jaSample: tmJa,
                error: tmJaError?.message 
            },
            terminology: {
                sample: termSample,
                error: termError?.message
            },
            env: {
                hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
