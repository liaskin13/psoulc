// System Constants — Single source of truth. Change here, applies everywhere.

export const ENTRY_CODE        = '0528';
export const BLACK_STAR_CODE   = '7677';
export const AMETHYST_CODE     = '4096'; // Angi's Crystal Vault access
export const MARS_CODE         = '1984'; // Jess B's Mars vault access
export const LISTENER_CODE     = '0000'; // placeholder — D sets the real code
export const ENTRY_FLYBY_DURATION_MS = 3000;

export const IGNITION_WARP_DURATION_MS = 2000;
export const IGNITION_STAGE_DURATION_MS = 800;
export const IGNITION_SETTLE_DELAY_MS = 500;

export const SOLAR_FLARE_DURATION_MS = 600;

export const LONG_PRESS_DURATION_MS = 1000;

// Console inbox — pending access requests
export const INBOX_KEY         = 'psc_inbox_requests';

// Member + listener registries
export const MEMBERS_KEY       = 'psc_members';
export const LISTENERS_KEY     = 'psc_listeners';

// Comment system
export const COMMENTS_KEY      = 'psc_comments';

// Session persistence — 4-hour TTL
export const SESSION_KEY      = 'psc_session';
export const SESSION_TTL_MS   = 4 * 60 * 60 * 1000;
export const GATE_LOCK_KEY    = 'psc_gate_lock';
export const GATE_MAX_ATTEMPTS = 3;
export const GATE_LOCKOUT_MS  = 30 * 1000;
export const BROADCAST_DURATION_MS = 5000;
export const VOID_DRAG_RADIUS_PX = 100;

// Tier identifiers
export const TIER_A = 'A';
export const TIER_B = 'B';
export const TIER_C = 'C';   // Saturn moon artists — read-only, own moon highlighted
export const TIER_G = 'G';   // Generic listeners — browse only, no comments

// Moon vault system
export const MOON_PREFIX  = 'moon_';         // planet field prefix for Tier C moon members

// Social presence
export const PRESENCE_KEY = 'psc_presence';  // localStorage key for online user registry

// True chakra spectrum colors for Void streak events only.
// These fire ONLY during spaghettification — ambient UI stays warm earth tones.
export const VOID_CHAKRA_COLORS = {
  mercury:  '#8B0000',  // Scarlet  — Root    — tight, fast
  venus:    '#ff7c00',  // Orange   — Sacral  — warm surge
  earth:    '#00cc44',  // Green    — Heart   — soil resonance
  mars:     '#c1440e',  // Iron Red — Sacral+ — volcanic surge
  saturn:   '#9b59b6',  // Violet   — Crown   — slow, commanding
  amethyst: '#6600cc',  // Indigo   — 3rd Eye — crystal vision
};

// D6: Soul-chakra ownership color per member.
// D's Solar Gold (#e8a020) is the Soul Star — 8th chakra, above the Crown.
// It is The Sun's frequency. No other member in the system shares this color.
export const D_CHAKRA_COLOR = '#e8a020';

export const MEMBER_CHAKRA_COLORS = {
  D:     '#e8a020', // Solar Gold — Soul Star (8th chakra). D only. Locked.
  Angi:  '#6600cc', // Indigo     — Third Eye (Amethyst planet)
  JessB: '#c1440e', // Iron Red   — Sacral+   (Mars planet)
};
