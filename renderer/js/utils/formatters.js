/**
 * Formatting Utilities for Kiosk Terminal
 * Handles monetary integer centavos conversion and pure SVG barcode generation.
 */

/**
 * Format integer centavos to Philippine Peso display string (e.g., 8900 -> ₱89.00).
 * Prevents IEEE-754 floating-point inaccuracies.
 * @param {number} centavos - Integer amount in centavos
 * @returns {string} Formatted PHP currency string
 */
export function formatCentavos(centavos) {
  if (typeof centavos !== 'number' || isNaN(centavos)) return '₱0.00';
  return '₱' + (centavos / 100).toFixed(2);
}

/**
 * Generate lightweight standalone SVG Barcode for cashier handheld optical scanners.
 * @param {string} codeText - Alpha-numeric barcode payload string
 * @param {number} width - Rendered width in pixels
 * @param {number} height - Rendered height in pixels
 * @returns {string} Standalone SVG markup string
 */
export function generateBarcodeSVG(codeText, width = 260, height = 65) {
  if (!codeText) return '';

  let pattern = '10100110110'; // Start guard bars
  for (let i = 0; i < codeText.length; i++) {
    const charCode = codeText.charCodeAt(i);
    const bits = (charCode * 31 % 127).toString(2).padStart(7, '0');
    pattern += bits + '0';
  }
  pattern += '11010010101'; // Stop guard bars

  const barCount = pattern.length;
  const barWidth = width / barCount;

  let rects = '';
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '1') {
      const x = (i * barWidth).toFixed(2);
      rects += `<rect x="${x}" y="0" width="${barWidth.toFixed(2)}" height="${height}" fill="#000000" />`;
    }
  }

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="block">
      <rect width="${width}" height="${height}" fill="#ffffff"/>
      ${rects}
    </svg>
  `;
}
