'use client';

import { useEffect, useRef } from 'react';

export function ArticleHistoryTracker({ id, title }: { id: string; title: string }) {
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const recordHistory = async () => {
            try {
                await fetch('/api/history/record', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        item_type: 'article',
                        item_id: id,
                        item_title: title
                    })
                });
            } catch (error) {
                console.error('Failed to record article history', error);
            }
        };

        recordHistory();
    }, [id, title]);

    return null;
}
