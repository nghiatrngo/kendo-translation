/**
 * Terminology Import API
 * 
 * POST /api/terminology/import - Import terminology from bundled JSON (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import kendoTerms from '@/lib/data/kendo_terms.json';

interface TermEntry {
    source_term: string;
    target_term: string;
    reading: string;
    domain: string;
    term_type: string;
    notes: string | null;
}

/**
 * POST /api/terminology/import
 * 
 * Import terminology from the bundled kendo_terms.json
 * Admin only - imports in batches
 */
export async function POST(request: NextRequest) {
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const clearExisting = body.clear_existing === true;

        // Optionally clear existing data
        if (clearExisting) {
            await supabase.from('terminology').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        }

        // Get terms from bundled JSON
        const terms: TermEntry[] = kendoTerms;

        // Import in batches of 100
        const batchSize = 100;
        let imported = 0;
        let skipped = 0;
        const errors: string[] = [];

        for (let i = 0; i < terms.length; i += batchSize) {
            const batch = terms.slice(i, i + batchSize).map(term => ({
                source_term: term.source_term,
                target_term: term.target_term,
                reading: term.reading || null,
                domain: term.domain || 'kendo',
                term_type: term.term_type || 'preferred',
                notes: term.notes || null,
            }));

            const { error, count } = await supabase
                .from('terminology')
                .upsert(batch, {
                    onConflict: 'source_term',
                    ignoreDuplicates: true
                });

            if (error) {
                errors.push(`Batch ${Math.floor(i / batchSize)}: ${error.message}`);
                skipped += batch.length;
            } else {
                imported += count || batch.length;
            }
        }

        return NextResponse.json({
            success: true,
            imported,
            skipped,
            total: terms.length,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Import failed' },
            { status: 500 }
        );
    }
}
