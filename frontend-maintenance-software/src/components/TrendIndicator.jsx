import React from 'react';
import '../styles/components/TrendIndicator.css';

/**
 * Shows trend with arrow and percentage change
 * Usage: <TrendIndicator value={5.2} /> or <TrendIndicator value={-3.1} />
 */
export function TrendIndicator({ value, showPercentage = true }) {
  if (value === 0 || value === null || value === undefined) {
    return (
      <span className="trend-indicator neutral">
        <span className="trend-icon">➡️</span>
        {showPercentage && <span className="trend-value">0%</span>}
      </span>
    );
  }
  
  const isPositive = value > 0;
  const isNegative = value < 0;
  
  return (
    <span className={`trend-indicator ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`}>
      <span className="trend-icon">
        {isPositive ? '📈' : isNegative ? '📉' : '➡️'}
      </span>
      {showPercentage && (
        <span className="trend-value">
          {isPositive ? '+' : ''}{value.toFixed(1)}%
        </span>
      )}
    </span>
  );
}

/**
 * Shows trend with just arrow (compact version)
 */
export function TrendArrow({ value }) {
  if (value === 0 || value === null || value === undefined) {
    return <span className="trend-arrow neutral">→</span>;
  }
  
  const isPositive = value > 0;
  const isNegative = value < 0;
  
  return (
    <span className={`trend-arrow ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`}>
      {isPositive ? '↑' : isNegative ? '↓' : '→'}
    </span>
  );
}

/**
 * Full trend card with label, value, and trend
 */
export function TrendCard({ label, value, trend, format = 'number' }) {
  const formatValue = (val) => {
    if (format === 'currency') return `$${val.toLocaleString()}`;
    if (format === 'percentage') return `${val}%`;
    return val.toLocaleString();
  };
  
  return (
    <div className="trend-card">
      <div className="trend-card-label">{label}</div>
      <div className="trend-card-value">{formatValue(value)}</div>
      <TrendIndicator value={trend} />
    </div>
  );
}

export default TrendIndicator;
