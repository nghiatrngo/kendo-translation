
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkContent() {
    console.log('--- Checking Agent Logs ---');
    const { data: logs, error: logsError } = await supabase.from('agent_logs').select('count', { count: 'exact' });
    if (logsError) console.error('Error fetching logs:', logsError.message);
    else console.log('Agent Log Count:', logs); // count is actually returned in 'count' property with head:true or just count property?
    // Let's just select top 5
    const { data: logEntries } = await supabase.from('agent_logs').select('*').limit(5);
    console.log('Recent Log Entries:', logEntries?.length);

    console.log('\n--- Checking Translation Memory ---');
    const { data: tm, error: tmError } = await supabase.from('translation_memory').select('*').limit(5);
    if (tmError) console.error('Error fetching TM:', tmError.message);
    else {
        console.log('TM Entries Found:', tm?.length);
        if (tm && tm.length > 0) console.log('Sample TM:', JSON.stringify(tm[0], null, 2));
    }

    console.log('\n--- Checking Terminology ---');
    const { data: terms, error: termError } = await supabase.from('terminology').select('*').limit(5);
    if (termError) console.error('Error fetching Terms:', termError.message);
    else {
        console.log('Terminology Entries Found:', terms?.length);
        if (terms && terms.length > 0) console.log('Sample Term:', JSON.stringify(terms[0], null, 2));
    }
}

checkContent();
