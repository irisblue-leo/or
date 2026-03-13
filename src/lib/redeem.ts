/**
 * Redeem code utilities
 */

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No 0/O/1/I confusion

/**
 * Generate a random redeem code: OCR-XXXX-XXXX-XXXX
 */
export function generateRedeemCode(): string {
  const segments = [];
  for (let i = 0; i < 3; i++) {
    let seg = "";
    for (let j = 0; j < 4; j++) {
      seg += CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    segments.push(seg);
  }
  return `OCR-${segments.join("-")}`;
}

/**
 * Validate redeem code format
 */
export function isValidRedeemCodeFormat(code: string): boolean {
  return /^OCR-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code);
}
