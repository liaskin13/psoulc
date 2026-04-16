import React, { useRef, useCallback, useEffect } from 'react';
import SaturnMoon from '../saturn/SaturnMoon';
import { LONG_PRESS_DURATION_MS } from '../config';

function EmpireNode({ node, onSelect, onLongPress, isActive, saturnMoons, onMoonSync }) {
  const pressTimerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);

  const cancelPress = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  const startPress = useCallback(() => {
    cancelPress();
    longPressTriggeredRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      onLongPress(node);
    }, LONG_PRESS_DURATION_MS);
  }, [cancelPress, node, onLongPress]);

  const finishPress = useCallback(() => {
    const longPressTriggered = longPressTriggeredRef.current;
    cancelPress();
    if (!longPressTriggered) {
      onSelect(node);
    }
    longPressTriggeredRef.current = false;
  }, [cancelPress, node, onSelect]);

  useEffect(() => {
    return () => {
      cancelPress();
    };
  }, [cancelPress]);

  return (
    <div
      className={`empire-node ${node.type} ${isActive ? 'active' : ''}`}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      aria-label={`${node.label} node. Owner ${node.owner}. Status ${node.status}.`}
      onMouseDown={startPress}
      onMouseUp={finishPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={finishPress}
      onTouchCancel={cancelPress}
      onBlur={cancelPress}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(node);
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
