/**
 * HOUSE OF PLEASANT (PSC) — Resident Blueprint Registry
 * 
 * This is the single source of truth for all Masters and Residents.
 * Update this registry to onboard new artists without manual code changes.
 */

export const RESIDENT_REGISTRY = [
  {
    residentId: 1,
    name: "D",
    accessCode: "0528",
    vaultId: "saturn",
    tier: "A", // Master / Sun
    palette: { primary: "#B87333", accent: "#ffbf00" },
  },
  {
    residentId: 2,
    name: "L",
    accessCode: "7677",
    vaultId: "architect",
    tier: "A", // Architect / Black Star
    palette: { primary: "#000000", accent: "#8B0000" },
  },
  {
    residentId: 11,
    name: "Angi",
    accessCode: "4096",
    vaultId: "amethyst",
    tier: "B", // Resident
    palette: { primary: "#6600cc", accent: "#ffbf00" },
  },
  {
    residentId: 12,
    name: "Jess B",
    accessCode: "1984",
    vaultId: "mars",
    tier: "B", // Resident
    palette: { primary: "#7c1212", accent: "#C0C0C0" },
  },
  {
    residentId: 101,
    name: "Janet",
    accessCode: "J-1966",
    vaultId: "moon_janet",
    tier: "C", // VIP / Love Letter
    palette: { primary: "#C0C0C0", accent: "#B87333" },
  }
];

/**
 * Finds a resident by their access code.
 * @param {string} code 
 * @returns {Object|null}
 */
export function findResidentByCode(code) {
  return RESIDENT_REGISTRY.find(r => r.accessCode === code) || null;
}

/**
 * Gets a resident's financial tier and split logic based on ID.
 */
export function getResidentMetadata(residentId) {
  const resident = RESIDENT_REGISTRY.find(r => r.residentId === residentId);
  if (!resident) return null;
  
  // Cross-reference with sovereignFinance IDs
  return {
    ...resident,
    isMaster: resident.residentId <= 10,
    isResident: resident.residentId > 10 && resident.residentId <= 100,
    isGuest: resident.residentId > 100
  };
}
