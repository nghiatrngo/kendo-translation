/**
 * Import Articles Script
 * 
 * Imports 315 JA-EN article pairs from matched_posts.json into Supabase
 * 
 * Usage: npx ts-node scripts/import-articles.ts
 * 
 * Requires:
 * - NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
 * - matched_posts.json from mARTr/data_crawler/kendo_jidai/
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

interface MatchedPost {
    en_url: string;
    jp_url: string;
    match_score: number;
    en_title: string;
    jp_title: string;
    en_slug: string;
    jp_slug: string;
    date: string;
}

interface MatchedPostsFile {
    match_date: string;
    min_score: number;
    stats: {
        total_matches: number;
        unmatched_en: number;
        unmatched_jp: number;
        en_articles: number;
        jp_articles: number;
    };
    matches: MatchedPost[];
}

async function importArticles() {
    // Path to matched_posts.json
    const matchedPostsPath = path.join(
        __dirname,
        '../../mARTr/data_crawler/kendo_jidai/matched_posts.json'
    );

    if (!fs.existsSync(matchedPostsPath)) {
        console.error(`File not found: ${matchedPostsPath}`);
        process.exit(1);
    }

    console.log('Reading matched_posts.json...');
    const rawData = fs.readFileSync(matchedPostsPath, 'utf8');
    const data: MatchedPostsFile = JSON.parse(rawData);

    console.log(`Found ${data.matches.length} matched articles`);
    console.log(`Stats: ${JSON.stringify(data.stats, null, 2)}`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const match of data.matches) {
        try {
            // Check if article already exists by source URL
            const { data: existing } = await supabase
                .from('articles')
                .select('id')
                .eq('source_url_en', match.en_url)
                .single();

            if (existing) {
                skipped++;
                continue;
            }

            // Insert new article
            const { error } = await supabase.from('articles').insert({
                title: match.en_title,
                title_ja: match.jp_title,
                source_url_en: match.en_url,
                source_url_ja: match.jp_url,
                match_score: match.match_score,
                created_at: new Date(match.date).toISOString(),
            });

            if (error) {
                console.error(`Error importing ${match.en_slug}:`, error.message);
                errors++;
            } else {
                imported++;
                if (imported % 50 === 0) {
                    console.log(`Imported ${imported} articles...`);
                }
            }
        } catch (err) {
            console.error(`Exception for ${match.en_slug}:`, err);
            errors++;
        }
    }

    console.log('\n--- Import Complete ---');
    console.log(`Imported: ${imported}`);
    console.log(`Skipped (already exists): ${skipped}`);
    console.log(`Errors: ${errors}`);
}

importArticles().catch(console.error);
