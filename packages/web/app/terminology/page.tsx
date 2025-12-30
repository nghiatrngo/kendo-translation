'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface Term {
    id: string;
    source_term: string;
    target_term: string;
    reading: string | null;
    domain: string;
    term_type: string;
    notes: string | null;
}

export default function TerminologyPage() {
    const [terms, setTerms] = useState<Term[]>([]);
    const [search, setSearch] = useState('');
    const [domain, setDomain] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchTerms = useCallback(async () => {
        setLoading(true);

        let query = supabase
            .from('terminology')
            .select('*', { count: 'exact' })
            .limit(50);

        if (search) {
            query = query.or(
                `source_term.ilike.%${search}%,target_term.ilike.%${search}%,reading.ilike.%${search}%`
            );
        }

        if (domain !== 'all') {
            query = query.eq('domain', domain);
        }

        const { data, error, count } = await query.order('source_term');

        if (error) {
            console.error('Error fetching terms:', error);
        } else {
            setTerms(data || []);
            setTotalCount(count || 0);
        }

        setLoading(false);
    }, [supabase, search, domain]);

    useEffect(() => {
        fetchTerms();
    }, [fetchTerms]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTerms();
        }, 300);
        return () => clearTimeout(timer);
    }, [search, domain, fetchTerms]);

    const domains = [
        { value: 'all', label: 'All Domains' },
        { value: 'kendo', label: 'Kendo Terms' },
        { value: 'giongo', label: 'Giongo (Sound)' },
        { value: 'gitaigo', label: 'Gitaigo (State)' },
        { value: 'giyogo', label: 'Giyogo (Movement)' },
        { value: 'gijogo', label: 'Gijogo (Emotion)' },
        { value: 'giseigo', label: 'Giseigo (Voice)' },
        { value: 'kendo_specific', label: 'Kendo Onomatopoeia' },
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📖 Terminology</h1>
            <p className="text-gray-600 mb-6">
                Searchable database of {totalCount} Kendo terms and onomatopoeia.
            </p>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="🔍 Search terms (日本語 or English)..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    {domains.map((d) => (
                        <option key={d.value} value={d.value}>
                            {d.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Results count */}
            <div className="text-gray-500 text-sm mb-4">
                Showing {terms.length} of {totalCount} terms
                {search && ` matching "${search}"`}
            </div>

            {/* Loading state */}
            {loading && (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading terms...</p>
                </div>
            )}

            {/* Term cards */}
            {!loading && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {terms.map((term) => (
                        <div
                            key={term.id}
                            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-2xl font-bold text-gray-900">
                                    {term.source_term}
                                </div>
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                    {term.domain}
                                </span>
                            </div>
                            {term.reading && (
                                <div className="text-gray-500 text-sm mb-2">{term.reading}</div>
                            )}
                            <div className="text-gray-700">{term.target_term}</div>
                            {term.notes && (
                                <div className="text-gray-500 text-sm mt-2 italic">
                                    {term.notes}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && terms.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-lg">No terms found</p>
                    <p className="text-gray-400 mt-2">
                        Try adjusting your search or filter
                    </p>
                </div>
            )}
        </div>
    );
}
