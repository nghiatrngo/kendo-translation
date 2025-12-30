/**
 * Import Translation Memory Script
 * 
 * Imports 1,264 TM entries from exported JSON into Supabase translation_memory table.
 * 
 * Usage: npx ts-node --esm --project scripts/tsconfig.json scripts/import-tm.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const dotenvPath = path.join(__dirname, '../packages/web/.env.local');
if (fs.existsSync(dotenvPath)) {
    const envContent = fs.readFileSync(dotenvPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim();
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Check .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface TMEntry {
    id: string;
    source_text: string;
    target_text: string;
    source_lang: string;
    target_lang: string;
    domain: string;
    quality: string;
    human_approved: number;
    source_url: string | null;
    created_at: string;
}

async function importTM() {
    const tmPath = path.join(__dirname, 'tm_export.json');

    if (!fs.existsSync(tmPath)) {
        console.error(`TM export file not found: ${tmPath}`);
        console.log('Run: sqlite3 mac_rag.db -json "SELECT * FROM translation_memory;" > scripts/tm_export.json');
        process.exit(1);
    }

    console.log('Loading TM data...');
    const tmData: TMEntry[] = JSON.parse(fs.readFileSync(tmPath, 'utf8'));
    console.log(`Loaded ${tmData.length} TM entries`);

    // Check existing count
    const { count: existingCount } = await supabase
        .from('translation_memory')
        .select('*', { count: 'exact', head: true });
    console.log(`Existing TM entries: ${existingCount || 0}`);

    if (existingCount && existingCount > 0) {
        console.log('Clearing existing entries...');
        const { error: deleteError } = await supabase
            .from('translation_memory')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        if (deleteError) {
            console.error('Error clearing:', deleteError.message);
        }
    }

    // Import in batches
    const batchSize = 50;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < tmData.length; i += batchSize) {
        const batch = tmData.slice(i, i + batchSize);

        const records = batch.map(entry => ({
            source_text: entry.source_text,
            target_text: entry.target_text,
            source_lang: entry.source_lang || 'ja',
            target_lang: entry.target_lang || 'en',
            domain: entry.domain || 'kendo',
            quality: entry.quality || 'silver',
            human_approved: Boolean(entry.human_approved),
            source_url: entry.source_url || null,
            // embedding will be populated later
        }));

        const { error } = await supabase.from('translation_memory').insert(records);

        if (error) {
            console.error(`Batch ${i}-${i + batch.length} error:`, error.message);
            errors += batch.length;
        } else {
            imported += batch.length;
            console.log(`Imported ${imported}/${tmData.length} entries...`);
        }
    }

    console.log('\n=== Import Complete ===');
    console.log(`Total imported: ${imported}`);
    console.log(`Errors: ${errors}`);

    // Verify final count
    const { count: finalCount } = await supabase
        .from('translation_memory')
        .select('*', { count: 'exact', head: true });
    console.log(`Final TM count: ${finalCount}`);
}

importTM().catch(console.error);
