/**
 * HOUSE OF PLEASANT (PSC) — Resident Blueprint Registry
 *
 * Single source of truth for all Masters and Residents.
 * Update this registry to onboard new artists without manual code changes.
 */

export const RESIDENT_REGISTRY = [
  {
    residentId: 1,
    name: "D",
    accessCode: "0528",
    vaultId: "saturn",
    tier: "A", // Master / Sun
    palette: { primary: "#B87333", accent: "#7a6a5a" },
  },
  {
    residentId: 2,
    name: "L",
    accessCode: "7677",
    vaultId: "architect",
    tier: "A", // Architect / Black Star
    palette: { primary: "#000000", accent: "#8B0000" },
  },
  // ── Muse Lockboxes — Featured Artists ─────────────────────────────────────
  // Mood references: visual atmosphere for each lockbox interior (DESIGN.md)
  {
    residentId: 101,
    name: "Janet",
    accessCode: "J-1966",
    vaultId: "lockbox_janet",
    tier: "C", // Featured Artist
    palette: { primary: "#cc3399", accent: "#B87333" },
  },
  {
    residentId: 102,
    name: "Erikah",
    accessCode: "E-1971",
    vaultId: "lockbox_erikah",
    tier: "C", // Featured Artist
    palette: { primary: "#cc6633", accent: "#8a5a42" },
  },
  {
    residentId: 103,
    name: "Larry",
    accessCode: "L-1988",
    vaultId: "lockbox_larry",
    tier: "C", // Featured Artist
    palette: { primary: "#7aaa5a", accent: "#B87333" },
  },
  {
    residentId: 104,
    name: "Drake",
    accessCode: "D-1986",
    vaultId: "lockbox_drake",
    tier: "C", // Featured Artist
    palette: { primary: "#c4a428", accent: "#B87333" },
  },
];

/**
 * Finds a resident by their access code.
 */
export function findResidentByCode(code) {
  return RESIDENT_REGISTRY.find((r) => r.accessCode === code) || null;
}

/**
 * Gets a resident's metadata with role flags derived from residentId.
 */
export function getResidentMetadata(residentId) {
  const resident = RESIDENT_REGISTRY.find((r) => r.residentId === residentId);
  if (!resident) return null;
  return {
    ...resident,
    isMaster: resident.residentId <= 10,
    isResident: resident.residentId > 10 && resident.residentId <= 100,
    isGuest: resident.residentId > 100,
  };
}
