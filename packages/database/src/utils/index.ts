/**
 * Utility functions for database operations
 */

/**
 * Generate URL-friendly slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric chars except spaces and hyphens
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate unique slug by appending number if slug exists
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug;
  let counter = 1;
  
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

/**
 * Validate Turkish phone number format
 */
export function validateTurkishPhone(phone: string): boolean {
  const turkishPhoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
  return turkishPhoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Format price for display with Turkish Lira
 */
export function formatPrice(amount: number, currency: string = 'TRY'): string {
  const formatter = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  });
  return formatter.format(amount);
}

/**
 * Generate price range string (e.g., "$$", "$$$")
 */
export function generatePriceRange(averagePrice: number): string {
  if (averagePrice < 100) return '$';
  if (averagePrice < 300) return '$$';
  if (averagePrice < 500) return '$$$';
  return '$$$$';
}

/**
 * Validate and format coordinates
 */
export function validateCoordinates(lat: number, lng: number): { lat: number; lng: number } | null {
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }
  return { lat: Number(lat.toFixed(7)), lng: Number(lng.toFixed(7)) };
}

/**
 * Calculate distance between two coordinates (in kilometers)
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
