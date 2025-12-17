import React, { useState, useEffect } from 'react';
import '../styles/components/LiveCharts.css';

// Trend Indicator - shows if numbers are going up, down, or staying flat
export function TrendIndicator({ value, previousValue, label }) {
  const change = previousValue ? ((value - previousValue) / previousValue) * 100 : 0;
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className={`trend-indicator ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`}>
      <span className="trend-arrow">
        {isPositive ? '↑' : isNegative ? '↓' : '→'}
      </span>
      <span className="trend-value">
        {Math.abs(change).toFixed(1)}%
      </span>
      {label && <span className="trend-label">{label}</span>}
    </div>
  );
}

// Live Stat Card - displays a key metric with optional trend comparison
export function LiveStatCard({ title, value, previousValue, icon, color = 'blue', subtitle, pulse = false }) {
  return (
    <div className={`live-stat-card ${pulse ? 'pulse' : ''}`} style={{ '--card-color': `var(--${color})` }}>
      <div className="stat-header">
        <div className="stat-icon" style={{ background: `var(--${color}-light)`, color: `var(--${color})` }}>
          {icon}
        </div>
        <div className="stat-content">
          <div className="stat-title">{title}</div>
          <div className="stat-value">{value}</div>
          {subtitle && <div className="stat-subtitle">{subtitle}</div>}
        </div>
      </div>
      {previousValue !== undefined && (
        <div className="stat-trend">
          <TrendIndicator value={value} previousValue={previousValue} label="vs last period" />
        </div>
      )}
    </div>
  );
}

// Live Line Chart - animated SVG chart showing data over time
export function LiveLineChart({ data, title, height = 200, showTrend = true }) {
  const [animatedData, setAnimatedData] = useState([]);

  useEffect(() => {
    // Animate the chart by starting with no data, then showing it after a tiny delay
    // This creates a nice drawing effect
    setAnimatedData([]);
    const timer = setTimeout(() => setAnimatedData(data), 100);
    return () => clearTimeout(timer);
  }, [data]);

  if (!data || data.length === 0) return null;

  // Figure out the min/max values to scale the chart properly
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;
  const padding = 20;
  const width = 100;

  // Calculate SVG points for the line path
  // For each data point, convert its value to an x,y coordinate on the SVG chart
  const points = animatedData.map((dataPoint, dataPointIndex) => {
    // Calculate horizontal position: spread data points evenly across chart width
    const horizontalPosition = (dataPointIndex / (animatedData.length - 1)) * (width - padding * 2) + padding;
    // Calculate vertical position: scale data value to chart height
    const verticalPosition = height - ((dataPoint.value - minValue) / range) * (height - padding * 2) - padding;
    return `${horizontalPosition},${verticalPosition}`;
  }).join(' ');

  // Create a filled area under the line for a nicer visual effect
  const areaPoints = animatedData.length > 0
    ? `${padding},${height - padding} ` + points + ` ${width - padding},${height - padding}`
    : '';

  // Calculate overall trend (up or down)
  const trend = data.length >= 2
    ? data[data.length - 1].value - data[0].value
    : 0;

  return (
    <div className="live-line-chart">
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
        {showTrend && data.length >= 2 && (
          <TrendIndicator
            value={data[data.length - 1].value}
            previousValue={data[0].value}
          />
        )}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="chart-svg"
        preserveAspectRatio="none"
      >
        {/* Grid lines for easier reading */}
        {[0, 0.25, 0.5, 0.75, 1].map((percent, i) => (
          <line
            key={i}
            x1={padding}
            y1={padding + (height - padding * 2) * percent}
            x2={width - padding}
            y2={padding + (height - padding * 2) * percent}
            className="grid-line"
          />
        ))}

        {/* Filled area under the line */}
        {animatedData.length > 0 && (
          <polygon
            points={areaPoints}
            className="chart-area"
          />
        )}

        {/* The main line connecting all data points */}
        {animatedData.length > 0 && (
          <polyline
            points={points}
            className="chart-line"
          />
        )}

        {/* Individual data point dots with pulse effect */}
        {animatedData.map((d, i) => {
          const x = (i / (animatedData.length - 1)) * (width - padding * 2) + padding;
          const y = height - ((d.value - minValue) / range) * (height - padding * 2) - padding;
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="2"
                className="chart-point"
              />
              <circle
                cx={x}
                cy={y}
                r="1.5"
                className="chart-point-pulse"
              />
            </g>
          );
        })}
      </svg>

      {/* Labels along the bottom */}
      <div className="chart-labels">
        {data.map((d, i) => (
          <span key={i} className="chart-label">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// Live Bar Chart - shows data as animated vertical bars
export function LiveBarChart({ data, title, height = 200, color = 'primary' }) {
  const [animatedData, setAnimatedData] = useState([]);

  useEffect(() => {
    // Animate bars growing from bottom to full height
    setAnimatedData([]);
    const timer = setTimeout(() => setAnimatedData(data), 100);
    return () => clearTimeout(timer);
  }, [data]);

  if (!data || data.length === 0) return null;

  // Find the tallest bar to scale everything else relative to it
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="live-bar-chart">
      <h3 className="chart-title">{title}</h3>
      <div className="bars-container" style={{ height: `${height}px` }}>
        {animatedData.map((d, i) => (
          <div key={i} className="bar-wrapper">
            <div
              className="bar"
              style={{
                height: `${(d.value / maxValue) * 100}%`,
                background: `linear-gradient(180deg, var(--${color}), var(--${color}-dark))`,
                transitionDelay: `${i * 50}ms` // Stagger animation for cooler effect
              }}
            >
              <span className="bar-value">{d.value}</span>
            </div>
            <span className="bar-label">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Comparison Period - shows current vs previous period side by side
export function ComparisonPeriod({ current, previous, label, unit = '' }) {
  const change = previous ? ((current - previous) / previous) * 100 : 0;
  const isPositive = change > 0;

  return (
    <div className="comparison-period">
      <div className="comparison-header">
        <span className="period-label">{label}</span>
      </div>
      <div className="comparison-values">
        <div className="current-value">
          <span className="value-label">Current</span>
          <span className="value-number">{current}{unit}</span>
        </div>
        <div className="comparison-arrow">
          {isPositive ? '→' : '←'}
        </div>
        <div className="previous-value">
          <span className="value-label">Previous</span>
          <span className="value-number">{previous}{unit}</span>
        </div>
      </div>
      <TrendIndicator value={current} previousValue={previous} label="change" />
    </div>
  );
}

// Real-time Update Indicator - shows when data was last updated
export function RealTimeIndicator({ lastUpdated, isLive = true }) {
  const [timeSince, setTimeSince] = useState('');

  useEffect(() => {
    const updateTime = () => {
      if (!lastUpdated) {
        setTimeSince('Never');
        return;
      }

      // Calculate how long ago the data was updated
      const seconds = Math.floor((Date.now() - lastUpdated) / 1000);
      if (seconds < 60) setTimeSince(`${seconds}s ago`);
      else if (seconds < 3600) setTimeSince(`${Math.floor(seconds / 60)}m ago`);
      else setTimeSince(`${Math.floor(seconds / 3600)}h ago`);
    };

    updateTime();
    // Update the timestamp every second
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className={`realtime-indicator ${isLive ? 'live' : 'offline'}`}>
      <span className="live-dot"></span>
      <span className="live-text">
        {isLive ? 'Live' : 'Offline'} • Updated {timeSince}
      </span>
    </div>
  );
}

// Progress Ring - circular progress indicator (looks nice!)
export function ProgressRing({ value, max = 100, size = 120, color = 'primary', label }) {
  const percentage = (value / max) * 100;
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  // Calculate how much of the circle to draw
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          className="progress-ring-background"
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        <circle
          className="progress-ring-circle"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`var(--${color})`}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="progress-ring-content">
        <div className="progress-value">{percentage.toFixed(0)}%</div>
        {label && <div className="progress-label">{label}</div>}
      </div>
    </div>
  );
}
