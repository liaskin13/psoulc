import React, { useState, useEffect } from 'react';
import { useSystem } from '../state/SystemContext';

function MasterClock() {
  const { isProtected } = useSystem();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`master-clock ${isProtected ? 'protected' : 'create'}`}>
      <div className="clock-frequency">528Hz</div>
      <div className="clock-time">{time.toLocaleTimeString()}</div>
      <div className="resonance-indicator">●</div>
    </div>
  );
}

export default MasterClock;
