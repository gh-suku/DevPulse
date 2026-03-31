// Issue #41: Real-time Form Validation
// Provides hooks and utilities for real-time form validation with visual feedback

import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationState {
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
}

/**
 * Hook for real-time form validation using Zod schemas
 */
export function useFormValidation<T extends z.ZodType>(
  schema: T,
  initialValues: z.infer<T>
) {
  const [values, setValues] = useState<z.infer<T>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState(false);

  // Validate a single field
  const validateField = useCallback(
    (fieldName: string, value: any) => {
      try {
        // Extract field schema if possible
        const fieldSchema = (schema as any).shape?.[fieldName];
        if (fieldSchema) {
          fieldSchema.parse(value);
          setErrors(prev => {
            const next = { ...prev };
            delete next[fieldName];
            return next;
          });
          return true;
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          setErrors(prev => ({
            ...prev,
            [fieldName]: error.errors[0]?.message || 'Invalid value',
          }));
          return false;
        }
      }
      return true;
    },
    [schema]
  );

  // Validate entire form
  const validateForm = useCallback(async () => {
    setIsValidating(true);
    try {
      await schema.parseAsync(values);
      setErrors({});
      setIsValidating(false);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          const field = err.path.join('.');
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      }
      setIsValidating(false);
      return false;
    }
  }, [schema, values]);

  // Handle field change with validation
  const handleChange = useCallback(
    (fieldName: string, value: any) => {
      setValues(prev => ({ ...prev, [fieldName]: value }));
      
      // Validate if field has been touched
      if (touched[fieldName]) {
        validateField(fieldName, value);
      }
    },
    [touched, validateField]
  );

  // Handle field blur
  const handleBlur = useCallback(
    (fieldName: string) => {
      setTouched(prev => ({ ...prev, [fieldName]: true }));
      validateField(fieldName, values[fieldName]);
    },
    [values, validateField]
  );

  // Reset form
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    isValid,
    isValidating,
    handleChange,
    handleBlur,
    validateForm,
    validateField,
    setValues,
    reset,
  };
}

/**
 * Validate email in real-time
 */
export function validateEmail(email: string): { isValid: boolean; message?: string } {
  if (!email) {
    return { isValid: false, message: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Invalid email format' };
  }
  
  return { isValid: true };
}

/**
 * Validate password strength in real-time
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  messages: string[];
} {
  const messages: string[] = [];
  let score = 0;

  if (password.length < 8) {
    messages.push('At least 8 characters');
  } else {
    score++;
  }

  if (!/[A-Z]/.test(password)) {
    messages.push('One uppercase letter');
  } else {
    score++;
  }

  if (!/[a-z]/.test(password)) {
    messages.push('One lowercase letter');
  } else {
    score++;
  }

  if (!/[0-9]/.test(password)) {
    messages.push('One number');
  } else {
    score++;
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    messages.push('One special character');
  } else {
    score++;
  }

  const strength = score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong';
  const isValid = score === 5;

  return { isValid, strength, messages };
}

/**
 * Debounced validation for expensive operations
 */
export function useDebouncedValidation<T>(
  value: T,
  validator: (value: T) => Promise<boolean> | boolean,
  delay: number = 500
) {
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsValidating(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const result = await validator(value);
        setIsValid(result);
      } catch (err) {
        setIsValid(false);
        setError(err instanceof Error ? err.message : 'Validation failed');
      } finally {
        setIsValidating(false);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [value, validator, delay]);

  return { isValidating, isValid, error };
}
