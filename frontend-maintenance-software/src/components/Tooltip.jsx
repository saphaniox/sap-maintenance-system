import React, { useState, useRef, useEffect } from 'react';
import '../styles/components/Tooltip.css';

/**
 * Reusable Tooltip component for complex features
 * Shows helpful information on hover/focus
 */
export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 300,
  className = ''
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        });
      }
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      hideTooltip();
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className={`tooltip-container ${className}`}>
      <div
        ref={triggerRef}
        className="tooltip-trigger"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-describedby={isVisible ? 'tooltip-content' : undefined}
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          id="tooltip-content"
          className={`tooltip-content ${position}`}
          style={{
            left: coords.x,
            top: coords.y
          }}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
}

/**
 * Simple tooltip wrapper for text with info icon
 */
export function InfoTooltip({ text, children }) {
  return (
    <Tooltip content={text} position="top">
      <span className="info-tooltip">
        {children}
        <span className="info-icon">ℹ️</span>
      </span>
    </Tooltip>
  );
}

/**
 * Tooltip for form fields
 */
export function FieldTooltip({ content, children }) {
  return (
    <div className="field-with-tooltip">
      <div className="field-label">
        {children}
        <Tooltip content={content} position="right">
          <span className="help-icon">?</span>
        </Tooltip>
      </div>
    </div>
  );
}

export default Tooltip;
