// THE SOVEREIGN MANIFEST — vault and system node definitions.

export const SYSTEM_NODES = [
  {
    id: 'primary',
    label: 'D — CONDUIT',
    type: 'conduit',
    owner: 'D',
    status: 'GOD_MODE_ACTIVE',
    description: 'Primary creator node'
  },
  {
    id: 'archive',
    label: 'L — ARCHITECT',
    type: 'architect',
    owner: 'L',
    status: 'ARCHITECT_ACTIVE',
    description: 'Archive and preservation node'
  }
];

export const VAULT_NODES = [
  {
    id: 'mercury',
    label: 'LIVE SETS',
    type: 'livestream',
    owner: 'VAULT',
    status: 'STANDBY',
    description: 'Live performance recordings'
  },
  {
    id: 'saturn',
    label: 'ORIGINAL MUSIC',
    type: 'compositions',
    owner: 'VAULT',
    status: 'ACTIVE',
    description: 'Original compositions — Janet, Erikah, Drake, Larry'
  },
  {
    id: 'venus',
    label: 'CURATED MIXES',
    type: 'mixes',
    owner: 'VAULT',
    status: 'ACTIVE',
    description: 'DJ sets and curated mixes'
  },
  {
    id: 'earth',
    label: 'SONIC ARCHIVE',
    type: 'blueprints',
    owner: 'VAULT',
    status: 'ACTIVE',
    description: 'Sonic architecture and blueprints'
  },
];

// For consumers that need all nodes.
export const EMPIRE_NODES = [...SYSTEM_NODES, ...VAULT_NODES];

// Legacy alias — kept for backward compat until all consumers migrate.
export const PLANET_NODES = VAULT_NODES;
export const BINARY_CORES = SYSTEM_NODES;
