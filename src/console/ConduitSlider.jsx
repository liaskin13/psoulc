import React, { useState } from 'react';

function ConduitSlider({ onBroadcast, isBroadcasting }) {
  const [sliderValue, setSliderValue] = useState(0);

  const handleSliderChange = (e) => {
    const value = parseInt(e.target.value);
    setSliderValue(value);
    if (value > 80) {
      onBroadcast();
    }
  };

  return (
    <div className="conduit-slider">
      <div className="slider-track">
        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={handleSliderChange}
          className="slider-input"
        />
        <div className="slider-label">{sliderValue > 80 ? 'THE LOVE' : 'FLOW STATE'}</div>
        <div className={`broadcast-indicator ${isBroadcasting ? 'active' : ''}`}>●</div>
      </div>
    </div>
  );
}

export default ConduitSlider;
