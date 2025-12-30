/**
 * Import All Articles Script
 * 
 * Imports ALL articles from both EN (550) and JP (399) sources into Supabase.
 * Links matched pairs using matched_posts.json data.
 * 
 * Data Sources:
 * - kendojidai_data.json (EN): 550 English articles with full content
 * - kendojidai_jp_data.json (JP): 399 Japanese articles with full content
 * - matched_posts.json: 315 matched EN-JP pairs
 * 
 * Usage: npx ts-node --esm --project scripts/tsconfig.json scripts/import-all-articles.ts
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

// Article interfaces
interface KendoArticle {
    url: string;
    title: string;
    author: string;
    published_date: string;
    categories: string[];
    tags: string[];
    content: string;
    excerpt: string;
    scraped_at: string;
    metadata?: {
        html_content?: string;
    };
}

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

async function clearExistingArticles() {
    console.log('Clearing existing articles...');
    const { error } = await supabase.from('articles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
        console.error('Error clearing articles:', error.message);
        return false;
    }
    console.log('Existing articles cleared.');
    return true;
}

async function importAllArticles() {
    // Paths to data files
    const enArticlesPath = path.join(__dirname, '../../mARTr/data_crawler/kendo_jidai/kendojidai_data.json');
    const jpArticlesPath = path.join(__dirname, '../../mARTr/data_crawler/kendo_jidai_jp/kendojidai_jp_data.json');
    const matchedPostsPath = path.join(__dirname, '../../mARTr/data_crawler/kendo_jidai/matched_posts.json');

    // Check files exist
    if (!fs.existsSync(enArticlesPath)) {
        console.error(`EN articles file not found: ${enArticlesPath}`);
        process.exit(1);
    }
    if (!fs.existsSync(jpArticlesPath)) {
        console.error(`JP articles file not found: ${jpArticlesPath}`);
        process.exit(1);
    }
    if (!fs.existsSync(matchedPostsPath)) {
        console.error(`Matched posts file not found: ${matchedPostsPath}`);
        process.exit(1);
    }

    // Load data
    console.log('Loading data files...');
    const enArticles: KendoArticle[] = JSON.parse(fs.readFileSync(enArticlesPath, 'utf8'));
    const jpArticles: KendoArticle[] = JSON.parse(fs.readFileSync(jpArticlesPath, 'utf8'));
    const matchedPosts: MatchedPostsFile = JSON.parse(fs.readFileSync(matchedPostsPath, 'utf8'));

    console.log(`EN articles: ${enArticles.length}`);
    console.log(`JP articles: ${jpArticles.length}`);
    console.log(`Matched pairs: ${matchedPosts.matches.length}`);

    // Create lookup maps
    const enUrlToArticle = new Map<string, KendoArticle>();
    for (const article of enArticles) {
        enUrlToArticle.set(article.url, article);
    }

    const jpUrlToArticle = new Map<string, KendoArticle>();
    for (const article of jpArticles) {
        jpUrlToArticle.set(article.url, article);
    }

    // Create EN-JP URL mappings from matched posts
    const enToJpUrl = new Map<string, string>();
    const jpToEnUrl = new Map<string, string>();
    const matchScores = new Map<string, number>();

    for (const match of matchedPosts.matches) {
        enToJpUrl.set(match.en_url, match.jp_url);
        jpToEnUrl.set(match.jp_url, match.en_url);
        matchScores.set(match.en_url, match.match_score);
        matchScores.set(match.jp_url, match.match_score);
    }

    // Track imported URLs to avoid duplicates
    const importedEnUrls = new Set<string>();
    const importedJpUrls = new Set<string>();

    let imported = 0;
    let errors = 0;

    // Clear existing articles first
    await clearExistingArticles();

    // 1. Import matched pairs (articles with both EN and JP versions)
    console.log('\n--- Importing matched EN-JP pairs ---');
    for (const match of matchedPosts.matches) {
        const enArticle = enUrlToArticle.get(match.en_url);
        const jpArticle = jpUrlToArticle.get(match.jp_url);

        if (!enArticle) {
            console.warn(`EN article not found: ${match.en_url}`);
            continue;
        }

        try {
            const { error } = await supabase.from('articles').insert({
                title: match.en_title,
                title_ja: match.jp_title,
                content_en: enArticle.content,
                content_ja: jpArticle?.content || null,
                source_url_en: match.en_url,
                source_url_ja: match.jp_url,
                match_score: match.match_score,
                tags: enArticle.tags.length > 0 ? enArticle.tags : null,
                created_at: new Date(match.date).toISOString(),
            });

            if (error) {
                console.error(`Error importing ${match.en_slug}:`, error.message);
                errors++;
            } else {
                imported++;
                importedEnUrls.add(match.en_url);
                importedJpUrls.add(match.jp_url);
                if (imported % 50 === 0) {
                    console.log(`Imported ${imported} matched pairs...`);
                }
            }
        } catch (err) {
            console.error(`Exception for ${match.en_slug}:`, err);
            errors++;
        }
    }

    console.log(`Matched pairs: ${imported} imported`);

    // 2. Import unmatched EN articles
    console.log('\n--- Importing unmatched EN articles ---');
    let unmatchedEn = 0;
    for (const article of enArticles) {
        if (importedEnUrls.has(article.url)) continue;

        try {
            const { error } = await supabase.from('articles').insert({
                title: article.title,
                title_ja: null,
                content_en: article.content,
                content_ja: null,
                source_url_en: article.url,
                source_url_ja: null,
                match_score: null,
                tags: article.tags.length > 0 ? article.tags : null,
                created_at: new Date(article.published_date).toISOString(),
            });

            if (error) {
                console.error(`Error importing EN ${article.url}:`, error.message);
                errors++;
            } else {
                imported++;
                unmatchedEn++;
                if (unmatchedEn % 50 === 0) {
                    console.log(`Imported ${unmatchedEn} unmatched EN articles...`);
                }
            }
        } catch (err) {
            console.error(`Exception for EN ${article.url}:`, err);
            errors++;
        }
    }
    console.log(`Unmatched EN: ${unmatchedEn} imported`);

    // 3. Import unmatched JP articles
    console.log('\n--- Importing unmatched JP articles ---');
    let unmatchedJp = 0;
    for (const article of jpArticles) {
        if (importedJpUrls.has(article.url)) continue;

        try {
            const { error } = await supabase.from('articles').insert({
                title: article.title, // JP title in title field if no EN
                title_ja: article.title,
                content_en: null,
                content_ja: article.content,
                source_url_en: null,
                source_url_ja: article.url,
                match_score: null,
                tags: article.tags.length > 0 ? article.tags : null,
                created_at: new Date(article.published_date).toISOString(),
            });

            if (error) {
                console.error(`Error importing JP ${article.url}:`, error.message);
                errors++;
            } else {
                imported++;
                unmatchedJp++;
                if (unmatchedJp % 50 === 0) {
                    console.log(`Imported ${unmatchedJp} unmatched JP articles...`);
                }
            }
        } catch (err) {
            console.error(`Exception for JP ${article.url}:`, err);
            errors++;
        }
    }
    console.log(`Unmatched JP: ${unmatchedJp} imported`);

    console.log('\n=== Import Complete ===');
    console.log(`Total imported: ${imported}`);
    console.log(`  - Matched pairs: ${matchedPosts.matches.length}`);
    console.log(`  - Unmatched EN: ${unmatchedEn}`);
    console.log(`  - Unmatched JP: ${unmatchedJp}`);
    console.log(`Errors: ${errors}`);
}

importAllArticles().catch(console.error);
