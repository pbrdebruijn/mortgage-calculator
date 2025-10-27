/**
 * Formatting utilities for currency and numbers
 */

/**
 * Formats a number as Euro currency
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "€1.234,56")
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null) return "€0"
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR"
  }).format(amount)
}

/**
 * Formats a number with specified decimal places
 * @param value - The value to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted number string
 */
export function formatNumber(value: number, decimals = 1): string {
  if (isNaN(value) || value === null) return "0"
  return value.toFixed(decimals)
}

/**
 * Formats a number as a percentage
 * @param value - The value to format as percentage (e.g., 3.5 for 3.5%)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string (e.g., "3.5%")
 */
export function formatPercentage(value: number, decimals = 1): string {
  if (isNaN(value) || value === null) return "0%"
  return `${value.toFixed(decimals)}%`
}

/**
 * Formats a number with thousand separators
 * @param value - The value to format
 * @returns Formatted number with thousand separators
 */
export function formatWithThousandSeparator(value: number): string {
  if (isNaN(value) || value === null) return "0"
  return new Intl.NumberFormat("nl-NL").format(value)
}
