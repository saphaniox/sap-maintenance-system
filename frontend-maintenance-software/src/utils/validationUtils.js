// Form Validation Utilities

/**
 * Validation rules
 */
export const validators = {
  required: (value) => {
    if (value === null || value === undefined || value === '') {
      return 'This field is required';
    }
    return null;
  },
  
  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },
  
  minLength: (min) => (value) => {
    if (!value) return null;
    if (value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return null;
  },
  
  maxLength: (max) => (value) => {
    if (!value) return null;
    if (value.length > max) {
      return `Must be no more than ${max} characters`;
    }
    return null;
  },
  
  min: (min) => (value) => {
    if (value === null || value === undefined || value === '') return null;
    if (Number(value) < min) {
      return `Must be at least ${min}`;
    }
    return null;
  },
  
  max: (max) => (value) => {
    if (value === null || value === undefined || value === '') return null;
    if (Number(value) > max) {
      return `Must be no more than ${max}`;
    }
    return null;
  },
  
  pattern: (regex, message = 'Invalid format') => (value) => {
    if (!value) return null;
    if (!regex.test(value)) {
      return message;
    }
    return null;
  },
  
  number: (value) => {
    if (!value) return null;
    if (isNaN(Number(value))) {
      return 'Must be a valid number';
    }
    return null;
  },
  
  positiveNumber: (value) => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      return 'Must be a positive number';
    }
    return null;
  },
  
  date: (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Please enter a valid date';
    }
    return null;
  },
  
  futureDate: (value) => {
    if (!value) return null;
    const date = new Date(value);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (date < now) {
      return 'Date must be in the future';
    }
    return null;
  },
  
  pastDate: (value) => {
    if (!value) return null;
    const date = new Date(value);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (date > now) {
      return 'Date must be in the past';
    }
    return null;
  },
};

/**
 * Validate a single field
 * @param {any} value - Field value
 * @param {Array} rules - Array of validation functions
 * @returns {string|null} Error message or null if valid
 */
export const validateField = (value, rules = []) => {
  for (const rule of rules) {
    const error = rule(value);
    if (error) {
      return error;
    }
  }
  return null;
};

/**
 * Validate entire form
 * @param {Object} formData - Form data object
 * @param {Object} validationRules - Validation rules object {fieldName: [rules]}
 * @returns {Object} Errors object {fieldName: errorMessage}
 */
export const validateForm = (formData, validationRules) => {
  const errors = {};
  
  for (const [field, rules] of Object.entries(validationRules)) {
    const value = formData[field];
    const error = validateField(value, rules);
    if (error) {
      errors[field] = error;
    }
  }
  
  return errors;
};

/**
 * Check if form has any errors
 * @param {Object} errors - Errors object
 * @returns {boolean} True if form has errors
 */
export const hasErrors = (errors) => {
  return Object.keys(errors).length > 0;
};

/**
 * Custom validation hook for React components
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationRules - Validation rules
 * @returns {Object} Validation utilities
 */
export const useFormValidation = (initialValues, validationRules) => {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});
  
  const validateSingleField = (name, value) => {
    const rules = validationRules[name] || [];
    return validateField(value, rules);
  };
  
  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateSingleField(name, values[name]);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };
  
  const validateAll = () => {
    const newErrors = validateForm(values, validationRules);
    setErrors(newErrors);
    
    // Mark all fields as touched
    const allTouched = Object.keys(validationRules).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);
    
    return !hasErrors(newErrors);
  };
  
  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };
  
  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    isValid: !hasErrors(errors),
  };
};
