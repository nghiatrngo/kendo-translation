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

const PAGE_SIZE = 50;

export default function TerminologyPage() {
    const [terms, setTerms] = useState<Term[]>([]);
    const [search, setSearch] = useState('');
    const [domain, setDomain] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchTerms = useCallback(async (pageNum: number = 0, append: boolean = false) => {
        if (append) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }

        const params = new URLSearchParams({
            page: pageNum.toString(),
            limit: PAGE_SIZE.toString(),
            search: search,
            domain: domain
        });

        try {
            const response = await fetch(`/api/terminology?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch terms');

            const data = await response.json();
            // API returns array, we need to handle count separately or update API to return { data, count }
            // For now assuming API returns just array, simulating count
            // TODO: Update API to return pagination metadata

            if (append) {
                setTerms(prev => [...prev, ...(data || [])]);
            } else {
                setTerms(data || []);
            }
            // Fallback total count since API doesn't return it yet
            setTotalCount(100);
            setPage(pageNum);
        } catch (error) {
            console.error('Error fetching terms:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [search, domain]);

    useEffect(() => {
        fetchTerms(0, false);
    }, [fetchTerms]);

    // Debounced search - reset to page 0
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(0);
            fetchTerms(0, false);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, domain, fetchTerms]);

    const loadMore = () => {
        fetchTerms(page + 1, true);
    };

    const hasMore = terms.length < totalCount;

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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Terminology</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                Searchable database of {totalCount} Kendo terms and onomatopoeia.
            </p>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search terms (日本語 or English)..."
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                    {domains.map((d) => (
                        <option key={d.value} value={d.value}>
                            {d.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Results count */}
            <div className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                Showing {terms.length} of {totalCount} terms
                {search && ` matching "${search}"`}
            </div>

            {/* Loading state */}
            {loading && (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Loading terms...</p>
                </div>
            )}

            {/* Term cards */}
            {!loading && (
                <>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {terms.map((term) => (
                            <div
                                key={term.id}
                                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {term.source_term}
                                    </div>
                                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                                        {term.domain}
                                    </span>
                                </div>
                                {term.reading && (
                                    <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">{term.reading}</div>
                                )}
                                <div className="text-gray-700 dark:text-gray-300">{term.target_term}</div>
                                {term.notes && (
                                    <div className="text-gray-500 dark:text-gray-400 text-sm mt-2 italic">
                                        {term.notes}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Load More Button */}
                    {hasMore && (
                        <div className="text-center mt-8">
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loadingMore ? (
                                    <span className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Loading...
                                    </span>
                                ) : (
                                    `Load More (${totalCount - terms.length} remaining)`
                                )}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Empty state */}
            {!loading && terms.length === 0 && (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No terms found</p>
                    <p className="text-gray-400 dark:text-gray-500 mt-2">
                        Try adjusting your search or filter
                    </p>
                </div>
            )}
        </div>
    );
}
