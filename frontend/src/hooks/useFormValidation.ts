/**
 * FUSION NEURAL — Form Validation Hook
 * Reusable validation for common form patterns.
 */
import { useState, useCallback } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: any) => string | null;
}

type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule;
};

export function useFormValidation<T extends Record<string, any>>(rules: ValidationRules<T>) {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const validate = useCallback((values: T): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    for (const key in rules) {
      const rule = rules[key];
      const value = values[key];

      if (rule?.required && (value === undefined || value === null || value === '')) {
        newErrors[key] = 'Field ini wajib diisi';
        isValid = false;
        continue;
      }

      if (value === undefined || value === null || value === '') continue;

      if (rule?.minLength && String(value).length < rule.minLength) {
        newErrors[key] = `Minimal ${rule.minLength} karakter`;
        isValid = false;
      }

      if (rule?.maxLength && String(value).length > rule.maxLength) {
        newErrors[key] = `Maksimal ${rule.maxLength} karakter`;
        isValid = false;
      }

      if (rule?.pattern && !rule.pattern.test(String(value))) {
        newErrors[key] = 'Format tidak valid';
        isValid = false;
      }

      if (rule?.min !== undefined && Number(value) < rule.min) {
        newErrors[key] = `Minimal ${rule.min}`;
        isValid = false;
      }

      if (rule?.max !== undefined && Number(value) > rule.max) {
        newErrors[key] = `Maksimal ${rule.max}`;
        isValid = false;
      }

      if (rule?.custom) {
        const customError = rule.custom(value);
        if (customError) {
          newErrors[key] = customError;
          isValid = false;
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [rules]);

  const clearErrors = useCallback(() => setErrors({}), []);

  const getFieldError = useCallback((key: keyof T) => errors[key], [errors]);

  return { errors, validate, clearErrors, getFieldError };
}

// Common validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^(\+62|62|0)[0-9]{9,13}$/,
  number: /^[0-9]+$/,
  url: /^https?:\/\/.+/,
};
