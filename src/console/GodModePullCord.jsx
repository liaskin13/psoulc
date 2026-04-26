import React, { useState } from 'react';
import { useSystem } from '../state/SystemContext';
import './GodModePullCord.css';

function GodModePullCord({ onPowerDown }) {
  const { isProtected, sealSystem, unsealSystem } = useSystem();
  const [isPulled, setIsPulled] = useState(false);
  const [showPowerDownConfirm, setShowPowerDownConfirm] = useState(false);

  const handlePull = () => {
    if (!isPulled) {
      setIsPulled(true);
      sealSystem();                                    // N8: real session severance
      setTimeout(() => setShowPowerDownConfirm(true), 1000);
    } else {
      if (onPowerDown) onPowerDown();
      setIsPulled(false);
      setShowPowerDownConfirm(false);
      unsealSystem();
    }
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setIsPulled(false);
    setShowPowerDownConfirm(false);
  };

  return (
    <div className={`pull-cord-system ${isProtected ? 'is-protected' : ''}`} onClick={handlePull}>

      {/* Braided rope — hangs from top edge, no socket */}
      <div className={`cord-rope ${isPulled ? 'pulled' : ''}`}>
        <div className="cord-braid" />
      </div>

      {/* Dog tags at the end — D's identity */}
      <div className={`cord-dogtags ${isPulled ? 'pulled' : ''}`}>
        <div className="dogtag dogtag-back">
          <span className="dogtag-text">D</span>
        </div>
        <div className="dogtag dogtag-front">
          <span className="dogtag-text">0528</span>
        </div>
      </div>

      {/* State label */}
      <div className={`cord-label ${isProtected ? 'protected' : 'create'}`}>
        {isProtected ? 'SEALED' : 'OPEN'}
      </div>

      {/* Power-down confirmation */}
      {showPowerDownConfirm && (
        <div className="power-down-confirm" onClick={e => e.stopPropagation()}>
          <div className="power-down-message">PULL AGAIN TO EXIT SYSTEM</div>
          <button className="power-down-cancel" onClick={handleCancel}>CANCEL</button>
        </div>
      )}
    </div>
  );
}

export default GodModePullCord;
