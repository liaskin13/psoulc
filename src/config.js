// System Constants — Single source of truth.

export const ENTRY_CODE = "0528";
export const BLACK_STAR_CODE = "7677";
export const LISTENER_CODE = "0000";
export const ENTRY_FLYBY_DURATION_MS = 3000;

// Console keys
export const INBOX_KEY = "psc_inbox_requests";
export const MEMBERS_KEY = "psc_members";
export const LISTENERS_KEY = "psc_listeners";
export const COMMENTS_KEY = "psc_comments";
export const SESSION_KEY = "psc_session";
export const SESSION_TTL_MS = 4 * 60 * 60 * 1000;
export const GATE_LOCK_KEY = "psc_gate_lock";
export const GATE_MAX_ATTEMPTS = 3;
export const GATE_LOCKOUT_MS = 30 * 1000;

// Industrial Identity Colors
export const STUDER_COPPER = "#B87333";
export const STUDER_SILVER = "#C0C0C0";
export const STUDER_AMBER = "#ffbf00";
export const AGED_STONE = "#8B7355";

// Serato navigation accent colors — functional signals, not identity colors
export const VAULT_ACCENT_COLORS = {
  saturn: "#1464dc", // Serato blue   — Original Music
  venus: "#8c14dc", // Serato purple — Mixes
  mercury: "#00c8dc", // Serato cyan   — Live Sets
  earth: "#14dc14", // Serato green  — Sonic Architecture
};

// Registry Colors (Replaces Chakra system)
export const VAULT_COLORS = {
  saturn: "#B87333", // Copper — Master Tracks
  venus: "#C0C0C0", // Silver — Curated Registry
  mercury: "#ffbf00", // Amber  — Live Resonance
  earth: "#8B7355", // Stone  — Sonic Architecture
};

export const D_IDENTITY_COLOR = "#ffbf00"; // Amber
export const D_CHAKRA_COLOR = "#ffbf00"; // Amber — D's personal chakra
export const BROADCAST_DURATION_MS = 5000;
export const LOCKBOX_PREFIX = "lockbox_";

export const LOCKBOX_CODES = {
  lockbox_janet: "J528",
  lockbox_erikah: "E432",
  lockbox_larry: "L396",
  lockbox_drake: "D741",
};

export const VAULT_DISPLAY_NAMES = {
  venus: "MIXES",
  saturn: "ORIGINAL MUSIC",
  mercury: "LIVE SETS",
  earth: "SONIC ARCH",
};

// Cloudflare Stream HLS URL for The Signal live broadcast
export const SIGNAL_HLS_URL = import.meta.env.VITE_SIGNAL_HLS_URL || "";

// Cloudflare R2 Upload Worker
// Set this to your deployed worker URL after running: cd worker && wrangler deploy
// Local dev: http://localhost:8787
// Production: https://psc-upload-worker.{your-account}.workers.dev
export const UPLOAD_WORKER_URL =
  import.meta.env.VITE_UPLOAD_WORKER_URL || "http://localhost:8787";

export const UPLOAD_SECRET = import.meta.env.VITE_UPLOAD_SECRET || "";

// True spectrum chakra colors — void events (distinct from ambient earth tones)
export const VOID_CHAKRA_COLORS = {
  saturn: "#cc4400", // Scarlet
  venus: "#ff8800", // Orange
  mercury: "#ffbf00", // Amber
  earth: "#00aa44", // Green
  moon: "#00b4d8", // Cyan (default for moon vaults)
};

// Member chakra colors — identity tones per collective role
export const MEMBER_CHAKRA_COLORS = {
  D: "#B87333", // Copper
  L: "#00e5ff", // Cyan
  B: "#ffbf00", // Amber
  C: "#6600cc", // Indigo
  default: "#8B7355", // Stone
};
