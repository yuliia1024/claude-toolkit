const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Parse a 'YYYY-MM-DD' calendar date as local midnight. */
export function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Number of nights between check-in and check-out (check-out day is not a night). */
export function nightsBetween(checkIn, checkOut) {
  const start = parseDate(checkIn);
  const end = parseDate(checkOut);
  if (end <= start) throw new RangeError('checkOut must be after checkIn');
  return Math.floor((end - start) / MS_PER_DAY);
}

/** Total price for a stay, in cents. */
export function stayPrice(checkIn, checkOut, nightlyRateCents) {
  return nightsBetween(checkIn, checkOut) * nightlyRateCents;
}
