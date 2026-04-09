import React, { useState } from 'react';
import SaturnMoon from '../saturn/SaturnMoon';
import { LONG_PRESS_DURATION_MS } from '../config';

function EmpireNode({ node, onSelect, onLongPress, isActive, saturnMoons, onMoonSync }) {
  const [pressTimer, setPressTimer] = useState(null);

  const handleMouseDown = () => {
    const timer = setTimeout(() => {
      onLongPress(node);
    }, LONG_PRESS_DURATION_MS);
    setPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
      onSelect(node);
    }
  };

  return (
    <div
      className={`empire-node ${node.type} ${isActive ? 'active' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (pressTimer) {
          clearTimeout(pressTimer);
          setPressTimer(null);
        }
      }}
    >
      <div className="node-core"></div>
      <div className="node-label">{node.label}</div>
      <div className="node-owner">{node.owner}</div>
      <div className="node-status">{node.status}</div>

      {node.id === 'saturn' && (
        <div className="saturn-moons">
          {saturnMoons.map(moon => (
            <SaturnMoon
              key={moon.id}
              moon={moon}
              onSync={onMoonSync}
              isActive={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default EmpireNode;
