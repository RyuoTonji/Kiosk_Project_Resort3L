/**
 * 3L's Beach Resort — Currency & Text Formatters
 * All monetary values are handled internally as integer centavos to avoid IEEE-754 floating point errors.
 */

/**
 * Format integer centavos into Philippine Peso string.
 * @param {number} centavos - e.g. 8500
 * @returns {string} - e.g. "₱85.00"
 */
export function formatCentavos(centavos) {
  const safeCentavos = Number.isFinite(centavos) ? centavos : 0;
  return '₱' + (safeCentavos / 100).toFixed(2);
}

/**
 * Format order sequence number.
 * @param {number|string} orderNum - e.g. 42
 * @returns {string} - e.g. "ORDER #042"
 */
export function formatOrderNumber(orderNum) {
  const num = parseInt(orderNum, 10) || 1;
  return `ORDER #${String(num).padStart(3, '0')}`;
}

/**
 * Format short order code.
 * @param {number|string} orderNum - e.g. 42
 * @returns {string} - e.g. "#042"
 */
export function formatShortOrder(orderNum) {
  const num = parseInt(orderNum, 10) || 1;
  return `#${String(num).padStart(3, '0')}`;
}

/**
 * Get formatted current date-time for display.
 * @returns {string} - e.g. "2026-09-13 10:45:00"
 */
export function formatDateTime(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
