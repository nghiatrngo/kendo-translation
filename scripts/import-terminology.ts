/**
 * Import Terminology Script
 * 
 * Imports kendo_terms.json (800+ entries) and onomatopoeia.json into Supabase
 * 
 * Usage: npx ts-node scripts/import-terminology.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM compatibility for __dirname
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

interface KendoTerm {
    source_term: string;
    target_term: string;
    reading: string;
    domain: string;
    term_type: string;
    notes: string | null;
}

interface OnomatopoeiaCategory {
    description: string;
    entries: Record<string, string[]>;
}

interface OnomatopoeiaFile {
    [key: string]: OnomatopoeiaCategory;
}

async function importKendoTerms() {
    const termsPath = path.join(
        __dirname,
        '../../mARTr/MAC-RAG/data/terminology/kendo_terms.json'
    );

    if (!fs.existsSync(termsPath)) {
        console.error(`File not found: ${termsPath}`);
        return 0;
    }

    console.log('Reading kendo_terms.json...');
    const rawData = fs.readFileSync(termsPath, 'utf8');
    const terms: KendoTerm[] = JSON.parse(rawData);

    console.log(`Found ${terms.length} kendo terms`);

    let imported = 0;
    let errors = 0;
    const batchSize = 50;

    for (let i = 0; i < terms.length; i += batchSize) {
        const batch = terms.slice(i, i + batchSize).map(term => ({
            source_term: term.source_term,
            target_term: term.target_term,
            reading: term.reading,
            domain: term.domain || 'kendo',
            term_type: term.term_type || 'preferred',
            notes: term.notes,
        }));

        const { error } = await supabase.from('terminology').insert(batch);

        if (error) {
            console.error(`Error importing batch at ${i}:`, error.message);
            errors += batch.length;
        } else {
            imported += batch.length;
            console.log(`Imported ${imported}/${terms.length} terms...`);
        }
    }

    console.log(`Kendo terms: ${imported} imported, ${errors} errors`);
    return imported;
}

async function importOnomatopoeia() {
    const onomatopoeiaPath = path.join(
        __dirname,
        '../../mARTr/MAC-RAG/data/onomatopoeia.json'
    );

    if (!fs.existsSync(onomatopoeiaPath)) {
        console.error(`File not found: ${onomatopoeiaPath}`);
        return 0;
    }

    console.log('Reading onomatopoeia.json...');
    const rawData = fs.readFileSync(onomatopoeiaPath, 'utf8');
    const data: OnomatopoeiaFile = JSON.parse(rawData);

    const entries: Array<{
        source_term: string;
        target_term: string;
        domain: string;
        term_type: string;
    }> = [];

    // Flatten the nested structure
    for (const [categoryKey, category] of Object.entries(data)) {
        if (typeof category === 'object' && 'entries' in category) {
            for (const [japanese, translations] of Object.entries(category.entries)) {
                entries.push({
                    source_term: japanese,
                    target_term: Array.isArray(translations) ? translations.join('; ') : String(translations),
                    domain: categoryKey,
                    term_type: 'onomatopoeia',
                });
            }
        }
    }

    console.log(`Found ${entries.length} onomatopoeia entries`);

    const { error } = await supabase.from('terminology').insert(entries);

    if (error) {
        console.error('Error importing onomatopoeia:', error.message);
        return 0;
    }

    console.log(`Onomatopoeia: ${entries.length} imported`);
    return entries.length;
}

async function main() {
    console.log('=== Terminology Import ===\n');

    const kendoCount = await importKendoTerms();
    const onomatopoeiaCount = await importOnomatopoeia();

    console.log('\n--- Import Complete ---');
    console.log(`Total terminology entries: ${kendoCount + onomatopoeiaCount}`);
}

main().catch(console.error);
