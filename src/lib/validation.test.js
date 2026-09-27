import { describe, it, expect } from 'vitest';
import {
  validateEntityName,
  validateDescription,
  validateCoordinates,
  validateDate,
  sanitizeInput,
  validateFileUpload,
  validateEmail,
  validateURL,
} from './validation';

describe('validation utilities', () => {
  describe('validateEntityName', () => {
    it('accepts valid names', () => {
      expect(validateEntityName('Plato')).toEqual({ valid: true, error: null });
      expect(validateEntityName('Alexander the Great')).toEqual({ valid: true, error: null });
      expect(validateEntityName('A'.repeat(200))).toEqual({ valid: true, error: null });
    });

    it('rejects empty names', () => {
      expect(validateEntityName('')).toEqual({ valid: false, error: 'Name is required' });
      expect(validateEntityName('   ')).toEqual({ valid: false, error: 'Name is required' });
      expect(validateEntityName(null)).toEqual({ valid: false, error: 'Name is required' });
      expect(validateEntityName(undefined)).toEqual({ valid: false, error: 'Name is required' });
    });

    it('rejects names longer than 200 characters', () => {
      const longName = 'A'.repeat(201);
      expect(validateEntityName(longName)).toEqual({
        valid: false,
        error: 'Name must be less than 200 characters',
      });
    });
  });

  describe('validateDescription', () => {
    it('accepts valid descriptions', () => {
      expect(validateDescription('A short description')).toEqual({ valid: true, error: null });
      expect(validateDescription('A'.repeat(5000))).toEqual({ valid: true, error: null });
      expect(validateDescription('')).toEqual({ valid: true, error: null });
    });

    it('respects required option', () => {
      expect(validateDescription('', { required: true })).toEqual({
        valid: false,
        error: 'Description is required',
      });
      expect(validateDescription('   ', { required: true })).toEqual({
        valid: false,
        error: 'Description is required',
      });
      expect(validateDescription('Valid', { required: true })).toEqual({
        valid: true,
        error: null,
      });
    });

    it('respects maxLength option', () => {
      expect(validateDescription('A'.repeat(101), { maxLength: 100 })).toEqual({
        valid: false,
        error: 'Description must be less than 100 characters',
      });
      expect(validateDescription('A'.repeat(100), { maxLength: 100 })).toEqual({
        valid: true,
        error: null,
      });
    });

    it('uses default maxLength of 5000', () => {
      expect(validateDescription('A'.repeat(5001))).toEqual({
        valid: false,
        error: 'Description must be less than 5000 characters',
      });
    });
  });

  describe('validateCoordinates', () => {
    it('accepts valid coordinates', () => {
      expect(validateCoordinates(0, 0)).toEqual({ valid: true, error: null });
      expect(validateCoordinates(37.9838, 23.7275)).toEqual({ valid: true, error: null }); // Athens
      expect(validateCoordinates(-90, -180)).toEqual({ valid: true, error: null });
      expect(validateCoordinates(90, 180)).toEqual({ valid: true, error: null });
    });

    it('rejects missing coordinates', () => {
      expect(validateCoordinates(null, 0)).toEqual({
        valid: false,
        error: 'Coordinates are required',
      });
      expect(validateCoordinates(0, null)).toEqual({
        valid: false,
        error: 'Coordinates are required',
      });
      expect(validateCoordinates(undefined, 0)).toEqual({
        valid: false,
        error: 'Coordinates are required',
      });
    });

    it('rejects non-numeric coordinates', () => {
      expect(validateCoordinates('40', 23)).toEqual({
        valid: false,
        error: 'Coordinates must be numbers',
      });
      expect(validateCoordinates(40, '23')).toEqual({
        valid: false,
        error: 'Coordinates must be numbers',
      });
    });

    it('rejects out-of-range latitude', () => {
      expect(validateCoordinates(-91, 0)).toEqual({
        valid: false,
        error: 'Latitude must be between -90 and 90',
      });
      expect(validateCoordinates(91, 0)).toEqual({
        valid: false,
        error: 'Latitude must be between -90 and 90',
      });
    });

    it('rejects out-of-range longitude', () => {
      expect(validateCoordinates(0, -181)).toEqual({
        valid: false,
        error: 'Longitude must be between -180 and 180',
      });
      expect(validateCoordinates(0, 181)).toEqual({
        valid: false,
        error: 'Longitude must be between -180 and 180',
      });
    });
  });

  describe('validateDate', () => {
    it('accepts valid dates', () => {
      expect(validateDate('2023-01-15')).toEqual({ valid: true, error: null });
      expect(validateDate('500 BC')).toEqual({ valid: true, error: null });
      expect(validateDate('January 1, 2000')).toEqual({ valid: true, error: null });
    });

    it('accepts empty dates when not required', () => {
      expect(validateDate('')).toEqual({ valid: true, error: null });
      expect(validateDate('   ')).toEqual({ valid: true, error: null });
    });

    it('rejects empty dates when required', () => {
      expect(validateDate('', { required: true })).toEqual({
        valid: false,
        error: 'Date is required',
      });
      expect(validateDate('   ', { required: true })).toEqual({
        valid: false,
        error: 'Date is required',
      });
    });

    it('rejects BC dates when allowBC is false', () => {
      expect(validateDate('500 BC', { allowBC: false })).toEqual({
        valid: false,
        error: 'BC/BCE dates are not allowed',
      });
      expect(validateDate('300 BCE', { allowBC: false })).toEqual({
        valid: false,
        error: 'BC/BCE dates are not allowed',
      });
    });

    it('accepts BC dates when allowBC is true', () => {
      expect(validateDate('500 BC', { allowBC: true })).toEqual({ valid: true, error: null });
      expect(validateDate('300 BCE', { allowBC: true })).toEqual({ valid: true, error: null });
    });

    it('rejects excessively long date strings', () => {
      const longDate = 'A'.repeat(101);
      expect(validateDate(longDate)).toEqual({
        valid: false,
        error: 'Date string is too long',
      });
    });
  });

  describe('sanitizeInput', () => {
    it('sanitizes HTML special characters', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
      expect(sanitizeInput('<img src="x" onerror="alert(1)">')).toBe(
        '&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;'
      );
    });

    it('handles quotes and apostrophes', () => {
      expect(sanitizeInput('"Hello"')).toBe('&quot;Hello&quot;');
      expect(sanitizeInput("It's a test")).toBe('It&#x27;s a test');
    });

    it('handles forward slashes', () => {
      expect(sanitizeInput('http://example.com')).toBe('http:&#x2F;&#x2F;example.com');
    });

    it('returns non-string values unchanged', () => {
      expect(sanitizeInput(123)).toBe(123);
      expect(sanitizeInput(null)).toBe(null);
      expect(sanitizeInput(undefined)).toBe(undefined);
      expect(sanitizeInput({ foo: 'bar' })).toEqual({ foo: 'bar' });
    });

    it('handles empty strings', () => {
      expect(sanitizeInput('')).toBe('');
    });
  });

  describe('validateFileUpload', () => {
    const createMockFile = (size, type) => ({
      size,
      type,
      name: 'test-file',
    });

    it('accepts valid files', () => {
      const pdfFile = createMockFile(1024 * 1024, 'application/pdf'); // 1MB
      expect(validateFileUpload(pdfFile)).toEqual({ valid: true, error: null });

      const imageFile = createMockFile(1024 * 1024, 'image/png');
      expect(validateFileUpload(imageFile)).toEqual({ valid: true, error: null });
    });

    it('rejects missing file', () => {
      expect(validateFileUpload(null)).toEqual({
        valid: false,
        error: 'No file selected',
      });
      expect(validateFileUpload(undefined)).toEqual({
        valid: false,
        error: 'No file selected',
      });
    });

    it('rejects files exceeding size limit', () => {
      const largeFile = createMockFile(101 * 1024 * 1024, 'application/pdf'); // 101MB
      expect(validateFileUpload(largeFile)).toEqual({
        valid: false,
        error: 'File size must be less than 100MB',
      });
    });

    it('respects custom maxSizeMB', () => {
      const file = createMockFile(6 * 1024 * 1024, 'application/pdf'); // 6MB
      expect(validateFileUpload(file, { maxSizeMB: 5 })).toEqual({
        valid: false,
        error: 'File size must be less than 5MB',
      });
      expect(validateFileUpload(file, { maxSizeMB: 10 })).toEqual({
        valid: true,
        error: null,
      });
    });

    it('rejects disallowed file types', () => {
      const txtFile = createMockFile(1024, 'text/plain');
      expect(validateFileUpload(txtFile)).toEqual({
        valid: false,
        error: 'File type not allowed. Allowed types: application/pdf, image/png, image/jpeg',
      });
    });

    it('respects custom allowedTypes', () => {
      const txtFile = createMockFile(1024, 'text/plain');
      expect(validateFileUpload(txtFile, { allowedTypes: ['text/plain'] })).toEqual({
        valid: true,
        error: null,
      });
    });

    it('allows all types when allowedTypes is empty array', () => {
      const txtFile = createMockFile(1024, 'text/plain');
      expect(validateFileUpload(txtFile, { allowedTypes: [] })).toEqual({
        valid: true,
        error: null,
      });
    });
  });

  describe('validateEmail', () => {
    it('accepts valid email addresses', () => {
      expect(validateEmail('user@example.com')).toEqual({ valid: true, error: null });
      expect(validateEmail('test.user+tag@example.co.uk')).toEqual({ valid: true, error: null });
      expect(validateEmail('a@b.c')).toEqual({ valid: true, error: null });
    });

    it('rejects empty emails', () => {
      expect(validateEmail('')).toEqual({ valid: false, error: 'Email is required' });
      expect(validateEmail('   ')).toEqual({ valid: false, error: 'Email is required' });
      expect(validateEmail(null)).toEqual({ valid: false, error: 'Email is required' });
      expect(validateEmail(undefined)).toEqual({ valid: false, error: 'Email is required' });
    });

    it('rejects invalid email formats', () => {
      expect(validateEmail('not-an-email')).toEqual({
        valid: false,
        error: 'Invalid email format',
      });
      expect(validateEmail('missing-at-sign.com')).toEqual({
        valid: false,
        error: 'Invalid email format',
      });
      expect(validateEmail('@missing-local.com')).toEqual({
        valid: false,
        error: 'Invalid email format',
      });
      expect(validateEmail('missing-domain@.com')).toEqual({
        valid: false,
        error: 'Invalid email format',
      });
      expect(validateEmail('missing-tld@domain')).toEqual({
        valid: false,
        error: 'Invalid email format',
      });
    });
  });

  describe('validateURL', () => {
    it('accepts valid URLs', () => {
      expect(validateURL('https://example.com')).toEqual({ valid: true, error: null });
      expect(validateURL('http://example.com')).toEqual({ valid: true, error: null });
      expect(validateURL('https://example.com/path?query=value#hash')).toEqual({
        valid: true,
        error: null,
      });
    });

    it('accepts empty URLs when not required', () => {
      expect(validateURL('')).toEqual({ valid: true, error: null });
      expect(validateURL('   ')).toEqual({ valid: true, error: null });
    });

    it('rejects empty URLs when required', () => {
      expect(validateURL('', { required: true })).toEqual({
        valid: false,
        error: 'URL is required',
      });
      expect(validateURL('   ', { required: true })).toEqual({
        valid: false,
        error: 'URL is required',
      });
    });

    it('rejects invalid URL formats', () => {
      expect(validateURL('not-a-url')).toEqual({
        valid: false,
        error: 'Invalid URL format',
      });
      expect(validateURL('example.com')).toEqual({
        valid: false,
        error: 'Invalid URL format',
      });
      expect(validateURL('://missing-protocol.com')).toEqual({
        valid: false,
        error: 'Invalid URL format',
      });
    });
  });
});
