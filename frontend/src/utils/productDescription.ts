/**
 * Product Description Sanitizer
 * Strips internal product metadata, HTML comments (e.g. DOVI_HOMEPAGE, DOVI_SPECS,
 * DOVI_DELIVERY, DOVI_CATEGORY), and leaked JSON strings from customer-facing descriptions.
 */
export function sanitizeProductDescription(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';

  let cleaned = raw
    // Strip all HTML comment blocks completely (e.g. <!-- DOVI_...: {...} --> or any other comments)
    .replace(/<!--[\s\S]*?-->/gi, '')
    // Strip leaked DOVI_HOMEPAGE, DOVI_SPECS, DOVI_DELIVERY, DOVI_CATEGORY if comments were unclosed
    .replace(/DOVI_HOMEPAGE:\s*\{[\s\S]*?\}/gi, '')
    .replace(/DOVI_SPECS:\s*\{[\s\S]*?\}/gi, '')
    .replace(/DOVI_DELIVERY:\s*\{[\s\S]*?\}/gi, '')
    .replace(/DOVI_CATEGORY:\s*\{[\s\S]*?\}/gi, '')
    // Strip raw escaped JSON blocks that contain internal keys
    .replace(/\{[^{}]*"(?:is_best_seller|is_trending|is_new_arrival|is_hot_sale|is_flash_deal|is_discount|is_featured|custom_section_ids|section_orders|flash_sale|discount_config)"[^{}]*\}/gi, '')
    .trim();

  // Normalize multiple consecutive blank lines to standard paragraph separation
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}
