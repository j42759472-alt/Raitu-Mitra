/**
 * Mirrors Android RatingUtils.getRatingColor / applyRatingColors.
 * Android system colors: holo_green_dark, holo_orange_dark, holo_red_dark, darker_gray.
 */

export const RATING_COLORS = {
  gold: '#FFD700',
  green: '#669900',
  orange: '#FF8800',
  red: '#CC0000',
  gray: '#AAAAAA',
} as const;

export function getRatingColor(rating: number): string {
  if (rating >= 4.5) return RATING_COLORS.gold;
  if (rating >= 4.0) return RATING_COLORS.green;
  if (rating >= 3.0) return RATING_COLORS.orange;
  if (rating > 0) return RATING_COLORS.red;
  return RATING_COLORS.gray;
}

/** Badge fill at ~10% opacity — matches Android ColorUtils.setAlphaComponent(..., 26). */
export function getRatingBadgeBackground(rating: number): string {
  const color = getRatingColor(rating);
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r},${g},${b},0.1)`;
}
