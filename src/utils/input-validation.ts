/**
 * Input validation and sanitization utilities
 * Ensures all user inputs are properly validated before processing
 */

/**
 * Sanitizes string input by removing potentially dangerous characters
 * @param input The string to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (!input) return "";

  // Remove script tags and other potentially harmful HTML
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

/**
 * Validates an email address format
 * @param email The email to validate
 * @returns Whether the email is valid
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a password meets security requirements
 * @param password The password to validate
 * @returns Whether the password meets security requirements
 */
export function isValidPassword(password: string): boolean {
  if (!password) return false;

  // At least 8 characters with at least one uppercase, one lowercase, and one number
  const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return strongPassword.test(password);
}

/**
 * Sanitizes and validates numeric input
 * @param input The number to validate
 * @returns Whether the input is a valid number
 */
export function isValidNumber(input: string | number): boolean {
  if (typeof input === "number") return !isNaN(input);
  if (!input) return false;

  return !isNaN(Number(input));
}

/**
 * Sanitizes a number input
 * @param input The number to sanitize
 * @param fallback Fallback value if input is invalid
 * @returns The validated number or fallback value
 */
export function sanitizeNumber(
  input: string | number,
  fallback: number = 0,
): number {
  if (typeof input === "number") return isNaN(input) ? fallback : input;
  if (!input) return fallback;

  const num = Number(input);
  return isNaN(num) ? fallback : num;
}
