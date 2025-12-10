/**
 * Sanitized logging utility
 * Strips sensitive data like session tokens from error logs
 */

const SENSITIVE_PATTERNS = [
  /sessionToken['":\s]+['"]?[\w-]{20,}['"]?/gi,
  /token['":\s]+['"]?[\w-]{20,}['"]?/gi,
  /authorization['":\s]+['"]?Bearer\s+[\w.-]+['"]?/gi,
];

const SENSITIVE_KEYS = [
  'sessionToken',
  'token',
  'authorization',
  'password',
  'secret',
  'apiKey',
  'api_key',
];

/**
 * Sanitize a string by replacing sensitive patterns
 */
function sanitizeString(str: string): string {
  let result = str;
  for (const pattern of SENSITIVE_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]');
  }
  return result;
}

/**
 * Recursively sanitize an object by removing sensitive keys
 */
function sanitizeObject(obj: unknown, depth = 0): unknown {
  // Prevent infinite recursion
  if (depth > 10) return '[MAX_DEPTH]';

  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeObject(value, depth + 1);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Sanitize an error object for safe logging
 */
function sanitizeError(error: unknown): unknown {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: sanitizeString(error.message),
      stack: error.stack ? sanitizeString(error.stack) : undefined,
      // Include any additional properties
      ...sanitizeObject(
        Object.fromEntries(
          Object.entries(error).filter(([key]) => !['name', 'message', 'stack'].includes(key))
        )
      ) as Record<string, unknown>,
    };
  }
  return sanitizeObject(error);
}

/**
 * Log an error with sensitive data sanitized
 */
export function logError(context: string, error: unknown): void {
  console.error(context, sanitizeError(error));
}

/**
 * Log a warning with sensitive data sanitized
 */
export function logWarn(context: string, data?: unknown): void {
  console.warn(context, data ? sanitizeObject(data) : '');
}

/**
 * Log info with sensitive data sanitized (only in development)
 */
export function logInfo(context: string, data?: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    console.info(context, data ? sanitizeObject(data) : '');
  }
}
