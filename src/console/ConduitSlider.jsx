import React, { useState } from "react";

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
          aria-label="Broadcast conduit — drag to activate The Signal"
          aria-valuetext={sliderValue > 80 ? "Signal active" : "Standby"}
        />
        <div className="slider-label">
          {sliderValue > 80 ? "SIGNAL OPEN" : "STANDBY"}
        </div>
        <div
          className={`broadcast-indicator ${isBroadcasting ? "active" : ""}`}
        >
          ●
        </div>
      </div>
    </div>
  );
}

export default ConduitSlider;
