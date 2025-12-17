// Simple Chart Components (lightweight, no external dependencies)

import React from 'react';
import '../styles/components/Charts.css';

// Main Charts Component - accepts different chart types
const Charts = ({ data, type = 'bar', title }) => {
  if (!data || !data.values || data.values.length === 0) {
    return (
      <div className="chart-container">
        {title && <h3 className="chart-title">{title}</h3>}
        <div className="chart-no-data">No data available</div>
      </div>
    );
  }

  if (type === 'pie') {
    return <PieChartSimple data={data} title={title} />;
  } else if (type === 'bar') {
    return <BarChartSimple data={data} title={title} />;
  } else if (type === 'line') {
    return <LineChartSimple data={data} title={title} />;
  }

  return <BarChartSimple data={data} title={title} />;
};

// Pie Chart Component
const PieChartSimple = ({ data, title }) => {
  const total = data.values.reduce((sum, val) => sum + val, 0);
  
  if (total === 0) {
    return (
      <div className="chart-container">
        {title && <h3 className="chart-title">{title}</h3>}
        <div className="chart-no-data">No data available</div>
      </div>
    );
  }

  let cumulativePercentage = 0;

  return (
    <div className="chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <div className="pie-chart-wrapper">
        <svg className="pie-chart" viewBox="0 0 100 100">
          {data.values.map((value, index) => {
            const percentage = (value / total) * 100;
            const angle = (percentage / 100) * 360;
            const startAngle = (cumulativePercentage / 100) * 360;
            
            const path = describeArc(50, 50, 40, startAngle, startAngle + angle);
            cumulativePercentage += percentage;
            
            return (
              <path
                key={index}
                d={path}
                fill={data.colors ? data.colors[index] : `hsl(${index * 60}, 70%, 50%)`}
                stroke="#fff"
                strokeWidth="0.5"
              />
            );
          })}
          <circle cx="50" cy="50" r="25" fill="white" />
        </svg>
        <div className="chart-legend">
          {data.labels.map((label, index) => (
            <div key={index} className="legend-item">
              <span 
                className="legend-color" 
                style={{ backgroundColor: data.colors ? data.colors[index] : `hsl(${index * 60}, 70%, 50%)` }}
              ></span>
              <span className="legend-label">{label}</span>
              <span className="legend-value">{data.values[index]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Simple Bar Chart
const BarChartSimple = ({ data, title }) => {
  const maxValue = Math.max(...data.values, 1);
  
  return (
    <div className="chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <div className="bar-chart-simple">
        {data.labels.map((label, index) => {
          const height = (data.values[index] / maxValue) * 100;
          return (
            <div key={index} className="bar-item-simple">
              <div className="bar-wrapper-simple">
                <div 
                  className="bar-fill" 
                  style={{ 
                    height: `${height}%`,
                    backgroundColor: data.colors ? data.colors[index] : `hsl(${index * 60}, 70%, 50%)`
                  }}
                >
                  <span className="bar-value">{data.values[index]}</span>
                </div>
              </div>
              <span className="bar-label-simple">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Line Chart
const LineChartSimple = ({ data, title }) => {
  const maxValue = Math.max(...data.values);
  const minValue = Math.min(...data.values);
  const range = maxValue - minValue || 1;
  
  const points = data.values.map((value, index) => {
    const x = (index / (data.values.length - 1)) * 100;
    const y = 100 - ((value - minValue) / range) * 100;
    return { x, y, value };
  });

  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  return (
    <div className="chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <div className="line-chart-wrapper">
        <svg className="line-chart" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path 
            d={`${pathData} L 100 100 L 0 100 Z`} 
            fill="url(#lineGradient)"
          />
          <path 
            d={pathData} 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="3"
              fill="#3b82f6"
              stroke="white"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        <div className="line-chart-labels">
          {data.labels.map((label, index) => (
            <div key={index} className="line-label">
              <span>{label}</span>
              <span className="line-value">{data.values[index]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper functions for pie chart
function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M", x, y,
    "L", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    "Z"
  ].join(" ");
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

export default Charts;

// Bar Chart Component (Original - kept for compatibility)
export const BarChart = ({ data, xKey, yKey, title, color = '#3b82f6', height = 300 }) => {
  if (!data || data.length === 0) {
    return <div className="chart-no-data">No data available</div>;
  }

  const maxValue = Math.max(...data.map(item => item[yKey]));
  const padding = 40;
  const barWidth = Math.max(30, (100 / data.length) - 10);

  return (
    <div className="chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <svg width="100%" height={height} className="bar-chart">
        {/* Y-axis labels */}
        <g className="y-axis">
          {[0, 25, 50, 75, 100].map(percentLevel => {
            // Convert percentage to actual value based on max
            const yAxisValue = (maxValue * percentLevel) / 100;
            // Calculate vertical position of the grid line
            const yCoordinate = height - padding - ((height - 2 * padding) * percentLevel) / 100;
            return (
              <g key={percentLevel}>
                <line
                  x1={padding}
                  y1={yCoordinate}
                  x2="100%"
                  y2={yCoordinate}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text x={padding - 5} y={yCoordinate + 4} textAnchor="end" className="axis-label">
                  {yAxisValue.toFixed(0)}
                </text>
              </g>
            );
          })}
        </g>

        {/* Bars */}
        {data.map((item, barIndex) => {
          // Calculate bar height as proportion of max value
          const barHeight = ((height - 2 * padding) * item[yKey]) / maxValue;
          // Calculate bar horizontal position: distribute evenly across width
          const barXPosition = padding + (barIndex * (100 - padding) / data.length) + '%';
          // Calculate bar top position: place bar at correct height
          const barYPosition = height - padding - barHeight;

          return (
            <g key={barIndex} className="bar-group">
              <rect
                x={barXPosition}
                y={barYPosition}
                width={`${barWidth}%`}
                height={barHeight}
                fill={color}
                className="bar"
              >
                <title>{`${item[xKey]}: ${item[yKey]}`}</title>
              </rect>
              <text
                x={barXPosition}
                y={height - padding / 2}
                textAnchor="start"
                className="bar-label"
                transform={`rotate(-45 ${barXPosition} ${height - padding / 2})`}
              >
                {item[xKey]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// Line Chart Component
export const LineChart = ({ data, xKey, yKeys, title, colors = ['#3b82f6', '#10b981'], height = 300 }) => {
  if (!data || data.length === 0) {
    return <div className="chart-no-data">No data available</div>;
  }

  const padding = 40;
  const width = 100;
  const chartHeight = height - 2 * padding;
  const chartWidth = width - 2 * padding;

  // Find max value across all yKeys
  const allValues = data.flatMap(item => yKeys.map(key => item[key] || 0));
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues, 0);

  const getX = (index) => padding + (index / (data.length - 1)) * chartWidth;
  const getY = (value) => height - padding - ((value - minValue) / (maxValue - minValue)) * chartHeight;

  return (
    <div className="chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="line-chart">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(percent => {
          const value = minValue + ((maxValue - minValue) * percent) / 100;
          const y = getY(value);
          return (
            <g key={percent}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="0.5"
              />
              <text x={padding - 2} y={y + 1} textAnchor="end" className="axis-label">
                {value.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Lines */}
        {yKeys.map((yKey, keyIndex) => {
          const points = data
            .map((item, index) => `${getX(index)},${getY(item[yKey] || 0)}`)
            .join(' ');

          return (
            <g key={yKey}>
              <polyline
                points={points}
                fill="none"
                stroke={colors[keyIndex] || '#3b82f6'}
                strokeWidth="2"
                className="line"
              />
              {/* Data points */}
              {data.map((item, index) => (
                <circle
                  key={index}
                  cx={getX(index)}
                  cy={getY(item[yKey] || 0)}
                  r="3"
                  fill={colors[keyIndex] || '#3b82f6'}
                  className="data-point"
                >
                  <title>{`${item[xKey]}: ${item[yKey]}`}</title>
                </circle>
              ))}
            </g>
          );
        })}

        {/* X-axis labels */}
        {data.map((item, index) => {
          if (index % Math.ceil(data.length / 6) === 0 || index === data.length - 1) {
            return (
              <text
                key={index}
                x={getX(index)}
                y={height - padding / 2}
                textAnchor="middle"
                className="axis-label"
              >
                {item[xKey]}
              </text>
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
};

// Pie Chart Component (Original - for data arrays with key/value pairs)
export const PieChart = ({ data, labelKey, valueKey, title, colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'] }) => {
  if (!data || data.length === 0) {
    return <div className="chart-no-data">No data available</div>;
  }

  const total = data.reduce((sum, item) => sum + item[valueKey], 0);
  const size = 200;
  const center = size / 2;
  const radius = size / 2 - 10;

  let currentAngle = -90;
  const slices = data.map((item, index) => {
    const percentage = (item[valueKey] / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    // Calculate slice path
    const start = polarToCartesian(center, center, radius, startAngle);
    const end = polarToCartesian(center, center, radius, endAngle);
    const largeArc = angle > 180 ? 1 : 0;
    const path = [
      `M ${center} ${center}`,
      `L ${start.x} ${start.y}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
      'Z'
    ].join(' ');

    currentAngle = endAngle;

    return {
      path,
      color: colors[index % colors.length],
      label: item[labelKey],
      value: item[valueKey],
      percentage: percentage.toFixed(1)
    };
  });

  return (
    <div className="chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <div className="pie-chart-wrapper">
        <svg width={size} height={size} className="pie-chart">
          {slices.map((slice, index) => (
            <path
              key={index}
              d={slice.path}
              fill={slice.color}
              className="pie-slice"
            >
              <title>{`${slice.label}: ${slice.value} (${slice.percentage}%)`}</title>
            </path>
          ))}
        </svg>
        <div className="pie-legend">
          {slices.map((slice, index) => (
            <div key={index} className="legend-item">
              <span className="legend-color" style={{ backgroundColor: slice.color }}></span>
              <span className="legend-label">{slice.label}</span>
              <span className="legend-value">{slice.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
export const StatCard = ({ title, value, subtitle, trend, icon, color = '#3b82f6' }) => {
  return (
    <div className="stat-card" style={{ borderTopColor: color }}>
      <div className="stat-header">
        <span className="stat-icon" style={{ color }}>{icon}</span>
        <h4 className="stat-title">{title}</h4>
      </div>
      <div className="stat-value">{value}</div>
      {subtitle && <div className="stat-subtitle">{subtitle}</div>}
      {trend && (
        <div className={`stat-trend ${trend > 0 ? 'positive' : 'negative'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
};
