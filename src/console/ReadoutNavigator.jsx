import React, { useEffect, useMemo, useState } from 'react';

const NODE_BANK = [
  { id: 'mercury', label: 'MERCURY', owner: 'LIVE SETS' },
  { id: 'venus', label: 'VENUS', owner: 'CURATED MIXES' },
  { id: 'earth', label: 'EARTH', owner: 'ARCHITECTURE' },
  { id: 'mars', label: 'MARS', owner: 'MARS VAULT' },
  { id: 'saturn', label: 'SATURN', owner: 'ORIGINAL MUSIC' },
  { id: 'amethyst', label: 'AMETHYST', owner: 'CRYSTAL VAULT' },
  { id: 'sun', label: 'SUN CORE', owner: 'PRIMARY NODE' },
  { id: 'binary-core', label: 'BLACK STAR', owner: 'ARCHIVE NODE' },
];

function ReadoutNavigator({ activeNode, onNodeSelect, onNodeLongPress }) {
  const initialIndex = useMemo(() => {
    const id = activeNode?.id;
    const idx = NODE_BANK.findIndex((n) => n.id === id);
    return idx >= 0 ? idx : 0;
  }, [activeNode]);

  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);

  const current = NODE_BANK[index];

  const rotate = (dir) => {
    setIndex((prev) => {
      const next = (prev + dir + NODE_BANK.length) % NODE_BANK.length;
      return next;
    });
  };

  const pushSelect = () => {
    onNodeSelect?.(current);
  };

  const longPress = () => {
    onNodeLongPress?.(current);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      rotate(-1);
      return;
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      rotate(1);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      pushSelect();
      return;
    }
    if (event.key.toLowerCase() === 'l') {
      event.preventDefault();
      longPress();
    }
  };

  return (
    <section
      className="readout-navigator"
      role="group"
      aria-label="Node readout and encoder navigation"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="readout-screen">
        <div className="readout-row">
          <span className="readout-k">CHANNEL</span>
          <span className="readout-v">{String(index + 1).padStart(2, '0')}/{NODE_BANK.length}</span>
        </div>
        <div className="readout-main">{current.label}</div>
        <div className="readout-row">
          <span className="readout-k">DOMAIN</span>
          <span className="readout-v">{current.owner}</span>
        </div>
        <div className="readout-row readout-row-last">
          <span className="readout-k">MODE</span>
          <span className="readout-v">ENCODER READY</span>
        </div>
      </div>

      <div className="encoder-cluster" role="group" aria-label="Encoder controls">
        <button className="encoder-btn" onClick={() => rotate(-1)} aria-label="Rotate encoder left">◀</button>
        <button className="encoder-push" onClick={pushSelect} aria-label="Push encoder to select">PUSH</button>
        <button className="encoder-btn" onClick={() => rotate(1)} aria-label="Rotate encoder right">▶</button>
      </div>

      <div className="readout-softkeys" aria-hidden="true">
        <span>EXPLORE</span>
        <span>TUNE</span>
        <span>VOID</span>
      </div>
    </section>
  );
}

export default ReadoutNavigator;
