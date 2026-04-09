import React from 'react';

function SaturnMoon({ moon, onSync, isActive }) {
  return (
    <div
      className={`saturn-moon ${isActive ? 'active' : ''}`}
      onClick={() => onSync(moon)}
    >
      <div className="moon-core"></div>
      <div className="moon-label">{moon.name}</div>
      <div className="moon-frequency">{moon.frequency}Hz</div>
    </div>
  );
}

export default SaturnMoon;
