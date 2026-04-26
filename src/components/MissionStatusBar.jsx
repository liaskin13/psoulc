import React, { useEffect, useMemo, useState } from 'react';

function formatMet(startedAt) {
  const deltaMs = Date.now() - startedAt;
  const total = Math.floor(deltaMs / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return `${String(days).padStart(3, '0')}:${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function MissionStatusBar({ archivedCount = 0, activeVaults = 0, systemNominal = true }) {
  const [now, setNow] = useState(Date.now());
  const missionStart = useMemo(() => {
    const key = 'psc_mission_start';
    const raw = localStorage.getItem(key);
    if (raw) return Number(raw);
    const start = Date.now();
    localStorage.setItem(key, String(start));
    return start;
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  void now;

  return (
    <div className="mission-status-bar" role="status" aria-live="polite">
      <span>PSC-001</span>
      <span>MISSION TIME: {formatMet(missionStart)}</span>
      <span>SYSTEM: {systemNominal ? 'NOMINAL' : 'DEGRADED'}</span>
      <span>ACTIVE VAULTS: {activeVaults}</span>
      <span>ARCHIVED: {archivedCount}</span>
    </div>
  );
}
