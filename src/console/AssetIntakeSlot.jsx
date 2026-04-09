import React, { useState } from 'react';

function AssetIntakeSlot({ onIntake }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="asset-intake-slot"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onIntake}
    >
      <div className="slot-opening">⟨⟩</div>
      <div className={`slot-label ${isHovered ? 'visible' : ''}`}>STEALTH</div>
    </div>
  );
}

export default AssetIntakeSlot;
