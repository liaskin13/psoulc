import React, { useState } from 'react';
import { useSystem } from '../state/SystemContext';
import './GodModePullCord.css';

function GodModePullCord({ onPowerDown }) {
  const { isProtected, toggleProtected } = useSystem();
  const [isPulled, setIsPulled] = useState(false);
  const [showPowerDownConfirm, setShowPowerDownConfirm] = useState(false);

  const handlePull = () => {
    // First pull = toggle protection state
    // Second pull (while held) = power down confirmation
    if (!isPulled) {
      setIsPulled(true);
      toggleProtected();
      // Show power-down warning after 1 second
      setTimeout(() => setShowPowerDownConfirm(true), 1000);
    } else {
      // Execute power-down
      if (onPowerDown) {
        onPowerDown();
      }
      setIsPulled(false);
      setShowPowerDownConfirm(false);
    }
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setIsPulled(false);
    setShowPowerDownConfirm(false);
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

      {/* Power-down confirmation overlay */}
      {showPowerDownConfirm && (
        <div className="power-down-confirm" onClick={e => e.stopPropagation()}>
          <div className="power-down-message">RELEASE CORD TO POWER DOWN</div>
          <button className="power-down-cancel" onClick={handleCancel}>CANCEL</button>
        </div>
      )}
    </div>
  );
}

export default GodModePullCord;
