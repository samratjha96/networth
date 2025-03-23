/**
 * API helper functions that utilize our input validation utilities
 */
import { AccountWithValue } from "@/types/accounts";
import { sanitizeNumber, sanitizeString } from "./input-validation";

/**
 * Sanitizes input data for account creation/updates
 * @param accountData The account data to sanitize
 * @returns Sanitized account data
 */
export function sanitizeAccountData(
  accountData: Partial<AccountWithValue>,
): Partial<AccountWithValue> {
  const sanitized: Partial<AccountWithValue> = { ...accountData };

  // Sanitize string fields
  if (sanitized.name !== undefined) {
    sanitized.name = sanitizeString(sanitized.name);
  }

  // Sanitize numeric fields
  if (sanitized.balance !== undefined) {
    sanitized.balance = sanitizeNumber(sanitized.balance);
  }

  return sanitized;
}

/**
 * Sanitizes user input for API requests
 * @param params Object containing parameters for API requests
 * @returns Sanitized parameters
 */
export function sanitizeApiParams<T extends Record<string, any>>(params: T): T {
  const sanitized = { ...params };

  // Process each field based on its type
  for (const key in sanitized) {
    const value = sanitized[key];

    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value) as any;
    } else if (
      typeof value === "number" ||
      (typeof value === "string" && !isNaN(Number(value)))
    ) {
      sanitized[key] = sanitizeNumber(value) as any;
    } else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeApiParams(value) as any;
    }
    // Arrays and other types are left as-is
  }

  return sanitized;
}

/**
 * Validates required fields in API requests
 * @param data The data to validate
 * @param requiredFields Array of required field names
 * @returns True if all required fields are present and valid
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[],
): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    const value = data[field];
    if (value === undefined || value === null || value === "") {
      missingFields.push(field);
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Creates an error response for invalid API requests
 * @param message Error message
 * @param details Additional error details
 * @returns Error object with structured format
 */
export function createApiError(
  message: string,
  details?: Record<string, any>,
): Error {
  const error = new Error(message);
  (error as any).details = details;
  return error;
}
