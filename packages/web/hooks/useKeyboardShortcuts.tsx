'use client'

import { useEffect, useCallback } from 'react'

interface KeyboardShortcuts {
    onSave?: () => void
    onAISuggest?: () => void
    onPrevious?: () => void
    onNext?: () => void
}

/**
 * Hook for handling keyboard shortcuts in translation editor
 * 
 * Shortcuts:
 * - Cmd/Ctrl+S: Save
 * - Cmd/Ctrl+Enter: Get AI Suggestion
 * - Left Arrow: Previous article (when not in input)
 * - Right Arrow: Next article (when not in input)
 */
export function useKeyboardShortcuts({
    onSave,
    onAISuggest,
    onPrevious,
    onNext,
}: KeyboardShortcuts) {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const isModifier = event.metaKey || event.ctrlKey
        const target = event.target as HTMLElement
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

        // Cmd/Ctrl+S: Save
        if (isModifier && event.key === 's') {
            event.preventDefault()
            onSave?.()
            return
        }

        // Cmd/Ctrl+Enter: AI Suggestion
        if (isModifier && event.key === 'Enter') {
            event.preventDefault()
            onAISuggest?.()
            return
        }

        // Arrow keys for navigation (only when not in input)
        if (!isInput) {
            if (event.key === 'ArrowLeft') {
                event.preventDefault()
                onPrevious?.()
                return
            }
            if (event.key === 'ArrowRight') {
                event.preventDefault()
                onNext?.()
                return
            }
        }
    }, [onSave, onAISuggest, onPrevious, onNext])

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])
}

/**
 * Display keyboard shortcut hints
 */
export function KeyboardShortcutHint({ shortcut, label }: { shortcut: string; label: string }) {
    return (
        <span className= "text-xs text-gray-400 dark:text-gray-500" >
        <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono" >
            { shortcut }
            </kbd>{' '}
    { label }
    </span>
    )
}
