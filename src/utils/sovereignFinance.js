/**
 * HOUSE OF PLEASANT (PSC) — Sovereign Financial Logic
 * 87/13 Alliance Registry
 */

export const RESIDENCY_TIERS = {
  TIER_I: { maxId: 10, artistSplit: 0.87, pscSplit: 0.13, label: 'Set in Stone' },
  TIER_II: { maxId: 43, artistSplit: 0.79, pscSplit: 0.21, label: 'Resident' },
  TIER_III: { maxId: 100, artistSplit: 0.71, pscSplit: 0.29, label: 'Registry' }
};

export const PRICING = {
  MONTHLY: 9.00,
  YEARLY: 99.00,
  INVESTOR: 999.00, // Copper Key
  SHADOW_DOWNLOAD_MIN: 1.00
};

export const MAINTENANCE_FEE = 100.00;
export const RECIPROCITY_THRESHOLD = 5000.00; // Masters/Residents pay fee ONLY after this monthly gross
export const WAIVER_THRESHOLD = 50;

/**
 * Calculates the split for a resident based on their ID.
 * @param {number} residentId - The unique ID of the resident.
 * @returns {Object} The split percentages.
 */
export function getResidencySplit(residentId) {
  if (residentId <= RESIDENCY_TIERS.TIER_I.maxId) return RESIDENCY_TIERS.TIER_I;
  if (residentId <= RESIDENCY_TIERS.TIER_II.maxId) return RESIDENCY_TIERS.TIER_II;
  return RESIDENCY_TIERS.TIER_III;
}

/**
 * Determines if the maintenance fee is due based on monthly earnings.
 * @param {number} monthlyGross - Total earnings for the month.
 * @returns {boolean}
 */
export function isMaintenanceDue(monthlyGross) {
  return monthlyGross >= RECIPROCITY_THRESHOLD;
}

/**
 * Calculates the final payout for an artist.
 * @param {number} residentId 
 * @param {number} grossAmount 
 * @returns {number}
 */
export function calculateArtistPayout(residentId, grossAmount) {
  const tier = getResidencySplit(residentId);
  return grossAmount * tier.artistSplit;
}

/**
 * Validates a Shadow Download (Pay-What-You-Want).
 * @param {number} amount 
 * @returns {boolean}
 */
export function validateShadowDownload(amount) {
  return amount >= PRICING.SHADOW_DOWNLOAD_MIN;
}
