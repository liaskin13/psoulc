// THE SOVEREIGN MANIFEST — Empire node definitions.
// All planetary identities, ownership, and status live here.

// Binary Cores — The dual gravitational heart of the system.
export const BINARY_CORES = [
  {
    id: 'sun',
    label: 'SUNSTAR',
    type: 'conduit',
    owner: 'D',
    status: 'GOD_MODE_ACTIVE',
    description: 'The Solar Heart of Creation'
  },
  {
    id: 'black-star',
    label: 'BLACK_STAR',
    type: 'architect',
    owner: 'L',
    status: 'ARCHITECT_ACTIVE',
    description: 'The Void of Preservation'
  }
];

// Vault Planets — Orbital bodies around the Binary Core.
export const PLANET_NODES = [
  {
    id: 'mercury',
    label: 'MERCURY',
    type: 'livestream',
    owner: 'PLANET',
    status: 'STANDBY',
    description: 'LIVE SETS — High-Velocity Stream'
  },
  {
    id: 'saturn',
    label: 'SATURN',
    type: 'compositions',
    owner: 'PLANET',
    status: '4_MOONS_SYNCED',
    description: 'COMPOSITIONS — Janet, Erikah, Drake, Larry'
  },
  {
    id: 'venus',
    label: 'VENUS',
    type: 'mixes',
    owner: 'PLANET',
    status: 'RESONATING',
    description: 'MIXES — Curated DJ Sets'
  },
  {
    id: 'earth',
    label: 'EARTH',
    type: 'blueprints',
    owner: 'PLANET',
    status: 'RESONATING',
    description: 'BLUEPRINTS — Sonic Architecture'
  },
  {
    id: 'amethyst',
    label: 'AMETHYST',
    type: 'bowls',
    owner: 'ANGI',
    status: 'CRYSTAL_LOCKED',
    description: 'Crystal Frequency Sets'
  },
  {
    id: 'px09',
    label: 'PX-09',
    type: 'ghost',
    owner: 'LATENT',
    status: 'AWAITING_ASSIGNMENT',
    description: 'Ghost Node — Unassigned'
  }
];

// Full manifest — for any consumer that needs all nodes.
export const EMPIRE_NODES = [...BINARY_CORES, ...PLANET_NODES];
