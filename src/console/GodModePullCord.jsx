import React, { useState } from 'react';
import { useSystem } from '../state/SystemContext';
import './GodModePullCord.css';

function GodModePullCord() {
  const { isProtected, toggleProtected } = useSystem();
  const [isPulled, setIsPulled] = useState(false);

  const handlePull = () => {
    setIsPulled(prev => !prev);
    toggleProtected();
  };

  return (
    <div className="pull-cord-system" onClick={handlePull}>
      {/* Rope cord */}
      <div className={`cord-rope ${isPulled ? 'pulled' : ''}`}></div>

      {/* Wooden orb toggle at end */}
      <div className={`cord-orb ${isPulled ? 'pulled' : ''} ${isProtected ? 'protected' : 'create'}`}>
        <div className="orb-grain"></div>
        <div className={`orb-pulse ${isProtected ? 'protected-glow' : 'create-glow'}`}>
          {isProtected ? '◉' : '◎'}
        </div>
      </div>

      {/* State label */}
      <div className={`cord-label ${isProtected ? 'protected' : 'create'}`}>
        {isProtected ? 'SEAL' : 'OPEN'}
      </div>
    </div>
  );
}

export default GodModePullCord;
