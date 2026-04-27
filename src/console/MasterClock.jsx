import React, { useState, useEffect } from 'react';

function MasterClock() {
  const [time, setTime] = useState(() => new Date());
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const ticker = setInterval(() => setPhase((p) => p + 0.35), 80);
    return () => clearInterval(ticker);
  }, []);

  const width = 72;
  const height = 20;
  const points = [];
  for (let x = 0; x <= width; x += 2) {
    const y = height / 2 + Math.sin((x / width) * Math.PI * 4 + phase) * 4;
    points.push(`${x},${y.toFixed(2)}`);
  }
  const polyline = points.join(' ');

  return (
    <div className="master-clock">
      <svg className="clock-oscilloscope" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <polyline points={polyline} />
      </svg>
      <div className="clock-time">{time.toLocaleTimeString()}</div>
      <div className="resonance-indicator">LIVE</div>
    </div>
  );
}

export default MasterClock;
