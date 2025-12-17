import React from 'react';
import '../styles/components/PasswordStrength.css';

/**
 * Password Strength Indicator
 * Shows visual feedback on password strength with requirements checklist
 */
export function PasswordStrength({ password }) {
  const getStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    
    let score = 0;
    
    // Length check
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    
    // Character variety checks
    if (/[a-z]/.test(pwd)) score++; // lowercase
    if (/[A-Z]/.test(pwd)) score++; // uppercase
    if (/[0-9]/.test(pwd)) score++; // numbers
    if (/[^a-zA-Z0-9]/.test(pwd)) score++; // special chars
    
    // Determine strength level
    if (score <= 2) return { score, label: 'Weak', color: 'danger' };
    if (score <= 4) return { score, label: 'Fair', color: 'warning' };
    if (score <= 5) return { score, label: 'Good', color: 'success' };
    return { score, label: 'Strong', color: 'success' };
  };
  
  const checkRequirement = (requirement) => {
    if (!password) return false;
    
    switch (requirement) {
      case 'length':
        return password.length >= 8;
      case 'lowercase':
        return /[a-z]/.test(password);
      case 'uppercase':
        return /[A-Z]/.test(password);
      case 'number':
        return /[0-9]/.test(password);
      case 'special':
        return /[^a-zA-Z0-9]/.test(password);
      default:
        return false;
    }
  };
  
  const strength = getStrength(password);
  const percentage = (strength.score / 6) * 100;
  
  if (!password) return null;
  
  return (
    <div className="password-strength">
      {/* Strength bar */}
      <div className="strength-bar">
        <div 
          className={`strength-fill ${strength.color}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      {/* Strength label */}
      <div className={`strength-label ${strength.color}`}>
        {strength.label}
      </div>
      
      {/* Requirements checklist */}
      <div className="strength-requirements">
        <RequirementItem 
          met={checkRequirement('length')}
          text="At least 8 characters"
        />
        <RequirementItem 
          met={checkRequirement('lowercase')}
          text="One lowercase letter"
        />
        <RequirementItem 
          met={checkRequirement('uppercase')}
          text="One uppercase letter"
        />
        <RequirementItem 
          met={checkRequirement('number')}
          text="One number"
        />
        <RequirementItem 
          met={checkRequirement('special')}
          text="One special character (!@#$%^&*)"
        />
      </div>
    </div>
  );
}

function RequirementItem({ met, text }) {
  return (
    <div className={`requirement-item ${met ? 'met' : 'unmet'}`}>
      <span className="requirement-icon">{met ? '✓' : '○'}</span>
      <span className="requirement-text">{text}</span>
    </div>
  );
}

export default PasswordStrength;
