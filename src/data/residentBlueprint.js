export const RESIDENT_REGISTRY = [
  {
    residentId: 1,
    name: "D",
    vaultId: "saturn",
    tier: "A",
    palette: { primary: "#B87333", accent: "#7a6a5a" },
  },
  {
    residentId: 2,
    name: "L",
    vaultId: "architect",
    tier: "A",
    palette: { primary: "#000000", accent: "#8B0000" },
  },
  {
    residentId: 999,
    name: "guest",
    vaultId: null,
    tier: "G",
    palette: { primary: "#333333", accent: "#555555" },
  },
];

export function getResidentMetadata(residentId) {
  const resident = RESIDENT_REGISTRY.find((r) => r.residentId === residentId);
  if (!resident) return null;
  return {
    ...resident,
    isMaster: resident.residentId <= 10,
    isGuest: resident.residentId >= 999,
  };
}
