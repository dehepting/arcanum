import { randomUUID } from 'crypto';

/**
 * Generate a RFC4122 v4 UUID
 */
export function generateUUID() {
  return randomUUID();
}
