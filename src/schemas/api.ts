/**
 * API Validation Helpers
 *
 * Utilities for validating API responses and external data using Zod schemas.
 * Provides type-safe parsing with helpful error messages.
 */

import { z } from 'zod';
import { logger } from '../utils/logger';

/**
 * Validation result type
 */
export type ValidationResult<T> =
  { success: true; data: T } | { success: false; error: string; issues: z.ZodIssue[] };

/**
 * Validate data against a Zod schema
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param context - Context string for error logging (e.g., "loadPeople API response")
 * @returns Validation result with parsed data or error details
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errorMessage = `Validation failed${context ? ` for ${context}` : ''}`;
  logger.error(errorMessage, {
    issues: result.error.issues,
    data,
  });

  return {
    success: false,
    error: errorMessage,
    issues: result.error.issues,
  };
}

/**
 * Validate and parse data, throwing on validation failure
 *
 * Use this when validation errors should not be recoverable.
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param context - Context string for error logging
 * @returns Parsed data
 * @throws {Error} If validation fails
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown, context?: string): T {
  const result = validate(schema, data, context);

  if (result.success === false) {
    const issueDetails = result.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`${result.error}\n${issueDetails.join('\n')}`);
  }

  return result.data;
}

/**
 * Validate array of items
 *
 * @param itemSchema - Zod schema for individual items
 * @param data - Array data to validate
 * @param context - Context string for error logging
 * @returns Validation result with parsed array or error details
 */
export function validateArray<T>(
  itemSchema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): ValidationResult<T[]> {
  return validate(z.array(itemSchema), data, context);
}

/**
 * Validate array and throw on failure
 *
 * @param itemSchema - Zod schema for individual items
 * @param data - Array data to validate
 * @param context - Context string for error logging
 * @returns Parsed array
 * @throws {Error} If validation fails
 */
export function validateArrayOrThrow<T>(
  itemSchema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T[] {
  return validateOrThrow(z.array(itemSchema), data, context);
}

/**
 * Validate optional data (returns null if data is null/undefined)
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param context - Context string for error logging
 * @returns Validation result with parsed data, null, or error details
 */
export function validateOptional<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): ValidationResult<T | null> {
  if (data === null || data === undefined) {
    return { success: true, data: null };
  }

  return validate(schema, data, context);
}

/**
 * Create a validation wrapper for Tauri invoke calls
 *
 * @param schema - Zod schema to validate response against
 * @param commandName - Tauri command name for error context
 * @returns Function that validates invoke response
 *
 * @example
 * const validatePerson = createTauriValidator(PersonSchema, 'create_person');
 * const person = await validatePerson(invoke('create_person', { input }));
 */
export function createTauriValidator<T>(schema: z.ZodSchema<T>, commandName: string) {
  return (data: unknown): T => {
    return validateOrThrow(schema, data, `Tauri command: ${commandName}`);
  };
}

/**
 * Create a validation wrapper for array responses from Tauri
 *
 * @param itemSchema - Zod schema for individual items
 * @param commandName - Tauri command name for error context
 * @returns Function that validates invoke response as array
 *
 * @example
 * const validatePeople = createTauriArrayValidator(PersonSchema, 'list_people');
 * const people = await validatePeople(invoke('list_people', { projectId }));
 */
export function createTauriArrayValidator<T>(itemSchema: z.ZodSchema<T>, commandName: string) {
  return (data: unknown): T[] => {
    return validateArrayOrThrow(itemSchema, data, `Tauri command: ${commandName}`);
  };
}
