import React, { useState, useEffect, useRef } from 'react';
import '../styles/components/SessionTimeout.css';

/**
 * Session Timeout Warning Component
 * Shows a modal warning before session expires, allowing user to extend session
 * 
 * @param {number} timeoutMinutes - Total session timeout in minutes (default: 30)
 * @param {number} warningMinutes - When to show warning before timeout (default: 5)
 * @param {function} onTimeout - Callback when session times out
 * @param {function} onExtend - Callback to extend session
 */
export function SessionTimeout({ 
  timeoutMinutes = 30, 
  warningMinutes = 5,
  onTimeout,
  onExtend 
}) {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);
  const countdownRef = useRef(null);
  
  // Reset session timeout on user activity
  const resetTimeout = () => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    // Hide warning if showing
    setShowWarning(false);
    
    // Set warning timer (show warning X minutes before timeout)
    const warningTime = (timeoutMinutes - warningMinutes) * 60 * 1000;
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      setTimeRemaining(warningMinutes * 60); // seconds
      
      // Start countdown
      countdownRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, warningTime);
    
    // Set actual timeout
    const totalTimeout = timeoutMinutes * 60 * 1000;
    timeoutRef.current = setTimeout(() => {
      handleTimeout();
    }, totalTimeout);
  };
  
  const handleTimeout = () => {
    setShowWarning(false);
    if (onTimeout) {
      onTimeout();
    }
  };
  
  const handleExtendSession = () => {
    if (onExtend) {
      onExtend();
    }
    resetTimeout();
  };
  
  useEffect(() => {
    // Activity events to track
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    // Start initial timeout
    resetTimeout();
    
    // Reset timeout on user activity
    const activityHandler = () => {
      if (!showWarning) {
        resetTimeout();
      }
    };
    
    events.forEach(event => {
      document.addEventListener(event, activityHandler);
    });
    
    // Cleanup
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      
      events.forEach(event => {
        document.removeEventListener(event, activityHandler);
      });
    };
  }, [showWarning]);
  
  // Format time remaining as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (!showWarning) return null;
  
  return (
    <div className="session-timeout-overlay">
      <div className="session-timeout-modal">
        <div className="session-timeout-icon">⏰</div>
        <h2>Session About to Expire</h2>
        <p>
          Your session will expire in <strong>{formatTime(timeRemaining)}</strong> due to inactivity.
        </p>
        <p className="session-timeout-hint">
          You'll be logged out automatically to protect your account.
        </p>
        
        <div className="session-timeout-actions">
          <button 
            onClick={handleExtendSession}
            className="extend-session-btn"
          >
            Stay Logged In
          </button>
          <button 
            onClick={handleTimeout}
            className="logout-now-btn"
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionTimeout;
