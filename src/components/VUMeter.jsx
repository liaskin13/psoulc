import React, { useMemo } from 'react';
import './VUMeter.css';

/**
 * Twin Analog VU Meter
 * Aesthetic: 1970s Industrial Recording Studio (Studer A800 vibe)
 * Measures: "Atmospheric Coherence" (Signal Level)
 */
const VUMeter = ({ value = 0, label = 'VU' }) => {
  // Map value (0-100) to rotation (-45 to 45 degrees)
  const rotation = useMemo(() => {
    const clamped = Math.min(Math.max(value, 0), 100);
    return (clamped / 100) * 90 - 45;
  }, [value]);

  return (
    <div className="vu-meter-container">
      <div className="vu-meter-bezel">
        <div className="vu-meter-face">
          <div className="vu-meter-scale">
            <span className="scale-left">-20</span>
            <span className="scale-center">0</span>
            <span className="scale-right">+3</span>
          </div>
          <div 
            className="vu-meter-needle" 
            style={{ transform: `rotate(${rotation}deg)` }} 
          />
          <div className="vu-meter-hub" />
        </div>
      </div>
      <div className="vu-meter-label">{label}</div>
    </div>
  );
};

export default VUMeter;
