import { useState, useEffect, useRef } from "react";
import { PRESENCE_KEY } from "../config";

const PRESENCE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const HEARTBEAT_MS = 30 * 1000; // refresh every 30s

// Deterministic behavior based on owner name — stable across sessions
function behaviorFor(owner) {
  let hash = 0;
  for (let i = 0; i < owner.length; i++) {
    hash = (hash * 31 + owner.charCodeAt(i)) >>> 0;
  }
  return ["float", "fly", "jump", "vibe"][hash % 4];
}

function readPresence() {
  try {
    return JSON.parse(localStorage.getItem(PRESENCE_KEY)) || [];
  } catch (_) {
    return [];
  }
}
function writePresence(list) {
  try {
    localStorage.setItem(PRESENCE_KEY, JSON.stringify(list));
  } catch (_) {}
}

export function usePresence(sessionMeta) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const ownId = useRef(null);

  useEffect(() => {
    if (!sessionMeta) return;

    const id = `${sessionMeta.owner}-${Date.now()}`;
    ownId.current = id;

    const myEntry = {
      id,
      owner: sessionMeta.owner,
      tier: sessionMeta.tier,
      planet: sessionMeta.vault,
      behavior: behaviorFor(sessionMeta.owner),
      lastSeen: Date.now(),
    };

    // Register presence
    const register = () => {
      const list = readPresence().filter((u) => u.id !== id);
      writePresence([...list, { ...myEntry, lastSeen: Date.now() }]);
    };
    register();

    // Heartbeat — keep lastSeen fresh
    const heartbeat = setInterval(register, HEARTBEAT_MS);

    // Read + filter other online users
    const refresh = () => {
      const threshold = Date.now() - PRESENCE_TTL_MS;
      const online = readPresence().filter(
        (u) => u.id !== id && u.lastSeen > threshold,
      );
      setOnlineUsers(online);
    };
    refresh();
    const poll = setInterval(refresh, 10_000); // re-read every 10s

    // Storage event — detect other tabs writing presence
    const onStorage = (e) => {
      if (e.key === PRESENCE_KEY) refresh();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      clearInterval(heartbeat);
      clearInterval(poll);
      window.removeEventListener("storage", onStorage);
      // Remove own entry on unmount
      const list = readPresence().filter((u) => u.id !== id);
      writePresence(list);
    };
  }, [sessionMeta?.owner]);

  return onlineUsers;
}
