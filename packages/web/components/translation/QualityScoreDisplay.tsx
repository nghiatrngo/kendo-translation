'use client';

/**
 * MAC-RAG Quality Score Display
 * Visualization component for translation quality metrics
 */

import React from 'react';

export interface QualityScores {
    overall: number;
    fluency: number;
    adequacy: number;
    terminology: number;
    style: number;
}

interface QualityScoreDisplayProps {
    scores: QualityScores;
    size?: 'compact' | 'full';
    showLabels?: boolean;
}

// Circular progress indicator
function CircularScore({ score, size = 60 }: { score: number; size?: number }) {
    const percentage = Math.round(score * 100);
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score * circumference);

    const color = score >= 0.85 ? '#10b981' : score >= 0.70 ? '#f59e0b' : '#ef4444';

    return (
        <div style={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="var(--border-color, #93a1a1)"
                    strokeWidth={strokeWidth}
                    opacity={0.3}
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
            </svg>
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: size * 0.3,
                fontWeight: 700,
                color: 'var(--text-primary, #073642)',
            }}>
                {percentage}
            </div>
        </div>
    );
}

// Linear progress bar
function ScoreBar({
    score,
    label,
    showValue = true
}: {
    score: number;
    label: string;
    showValue?: boolean;
}) {
    const percentage = Math.round(score * 100);
    const color = score >= 0.85 ? '#10b981' : score >= 0.70 ? '#f59e0b' : '#ef4444';

    return (
        <div style={{ marginBottom: 8 }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 4,
                fontSize: 12,
            }}>
                <span style={{ color: 'var(--text-secondary, #586e75)' }}>{label}</span>
                {showValue && (
                    <span style={{ fontWeight: 500, color }}>{percentage}%</span>
                )}
            </div>
            <div style={{
                height: 6,
                background: 'var(--bg-secondary, #eee8d5)',
                borderRadius: 3,
                overflow: 'hidden'
            }}>
                <div style={{
                    height: '100%',
                    width: `${percentage}%`,
                    background: color,
                    borderRadius: 3,
                    transition: 'width 0.5s ease'
                }} />
            </div>
        </div>
    );
}

// Quality grade badge
function QualityGrade({ score }: { score: number }) {
    let grade: string;
    let color: string;
    let bg: string;

    if (score >= 0.95) {
        grade = 'A+'; color = '#065f46'; bg = '#d1fae5';
    } else if (score >= 0.90) {
        grade = 'A'; color = '#065f46'; bg = '#d1fae5';
    } else if (score >= 0.85) {
        grade = 'B+'; color = '#1e40af'; bg = '#dbeafe';
    } else if (score >= 0.80) {
        grade = 'B'; color = '#1e40af'; bg = '#dbeafe';
    } else if (score >= 0.75) {
        grade = 'C+'; color = '#92400e'; bg = '#fef3c7';
    } else if (score >= 0.70) {
        grade = 'C'; color = '#92400e'; bg = '#fef3c7';
    } else {
        grade = 'D'; color = '#991b1b'; bg = '#fee2e2';
    }

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 700,
            color,
            background: bg,
        }}>
            {grade}
        </span>
    );
}

export default function QualityScoreDisplay({
    scores,
    size = 'full',
    showLabels = true,
}: QualityScoreDisplayProps) {
    if (size === 'compact') {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 8px',
                background: 'var(--bg-secondary, #eee8d5)',
                borderRadius: 6,
            }}>
                <QualityGrade score={scores.overall} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary, #586e75)' }}>
                    {Math.round(scores.overall * 100)}% quality
                </span>
            </div>
        );
    }

    return (
        <div className="quality-score-display">
            <style jsx>{`
        .quality-score-display {
          background: var(--bg-primary, #fdf6e3);
          border: 1px solid var(--border-color, #93a1a1);
          border-radius: 8px;
          padding: 16px;
        }
        .header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-color, #93a1a1);
        }
        .overall-section {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .overall-label {
          font-size: 11px;
          color: var(--text-secondary, #586e75);
          margin-top: 4px;
        }
        .grade-section {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .dimensions {
          flex: 1;
        }
      `}</style>

            <div className="header">
                <div className="overall-section">
                    <CircularScore score={scores.overall} size={70} />
                    {showLabels && <span className="overall-label">Overall</span>}
                </div>

                <div className="grade-section">
                    <QualityGrade score={scores.overall} />
                    {showLabels && <span className="overall-label" style={{ marginTop: 4 }}>Grade</span>}
                </div>

                <div className="dimensions">
                    <ScoreBar score={scores.fluency} label="Fluency" />
                    <ScoreBar score={scores.adequacy} label="Adequacy" />
                    <ScoreBar score={scores.terminology} label="Terminology" />
                    <ScoreBar score={scores.style} label="Style" />
                </div>
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                color: 'var(--text-muted, #93a1a1)',
            }}>
                <span>F: {Math.round(scores.fluency * 100)}%</span>
                <span>A: {Math.round(scores.adequacy * 100)}%</span>
                <span>T: {Math.round(scores.terminology * 100)}%</span>
                <span>S: {Math.round(scores.style * 100)}%</span>
            </div>
        </div>
    );
}

// Export individual components for flexible use
export { CircularScore, ScoreBar, QualityGrade };
