import React, { useState } from 'react';
import { motion } from 'framer-motion';
import RecordShelf from '../components/RecordShelf';
import StuderTransportBar from '../components/StuderTransportBar';
import TuneModal from '../components/TuneModal';
import { EARTH_DOCUMENTS } from '../data/earth';

// Earth spine palette — color by classification level.
const CLASS_PALETTE = {
  'top-secret':   { highlight: '#ff9090', base: '#cc2020', shadow: '#3a0000', glow: 'rgba(220,40,40,0.75)'  },
  'confidential': { highlight: '#ffcc88', base: '#c87820', shadow: '#3a2000', glow: 'rgba(200,130,30,0.75)' },
  'classified':   { highlight: '#88cc88', base: '#228840', shadow: '#001800', glow: 'rgba(40,160,60,0.75)'  },
};

const DOC_ITEMS = EARTH_DOCUMENTS.map(d => ({
  id:       `doc-${d.id}`,
  label:    d.title,
  sublabel: `${d.year} · ${d.classification.replace('-', ' ').toUpperCase()}`,
  metadata: d,
  ...(CLASS_PALETTE[d.classification] || CLASS_PALETTE.classified),
}));

function EarthSafe({ onBack, onVoid }) {
  const [activeId,        setActiveId]        = useState(null);
  const [activeTrack,     setActiveTrack]     = useState(null);
  const [transportState,  setTransportState]  = useState('stop');
  const [pitchMultiplier, setPitchMultiplier] = useState(1.0);
  const [tuneItem,        setTuneItem]        = useState(null);
  const [docItems,        setDocItems]        = useState(DOC_ITEMS);

  const handleSelect = item => {
    setActiveId(item.id);
    setActiveTrack({ label: item.label, sublabel: item.sublabel });
    setTransportState('stop');
  };

  const handleTune = () => {
    if (!activeId) return;
    const item = docItems.find(i => i.id === activeId);
    if (item) setTuneItem(item);
  };

  const handleTuneSave = (updates) => {
    setDocItems(prev => prev.map(i =>
      i.id === tuneItem.id
        ? { ...i, label: updates.label }
        : i
    ));
    if (activeId === tuneItem.id) {
      setActiveTrack(prev => ({ ...prev, label: updates.label }));
    }
    setTuneItem(null);
  };

  const handleVoid = () => {
    if (!activeId) return;
    const item = docItems.find(i => i.id === activeId);
    if (item && onVoid) {
      onVoid({ id: item.id, label: item.label, sublabel: item.sublabel });
      setDocItems(prev => prev.filter(i => i.id !== activeId));
      setActiveId(null);
      setActiveTrack(null);
    }
  };

  return (
    <motion.div
      className="vault-screen earth-safe"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.08, 0, 0.3, 1] }}
    >
      <div className="vault-header">
        <h1 className="vault-title">EARTH</h1>
        <p className="vault-subtitle">SONIC ARCHITECTURE · EYES ONLY</p>
      </div>

      <div className="vault-commands">
        <button className="god-btn" onClick={onBack}>← BACK</button>
        <button className="god-btn" onClick={handleTune}  disabled={!activeId} style={{ opacity: activeId ? 1 : 0.4 }}>TUNE</button>
        <button className="god-btn" onClick={handleVoid} disabled={!activeId} style={{ opacity: activeId ? 1 : 0.4 }}>VOID</button>
        <button className="god-btn">SEAL</button>
      </div>

      {tuneItem && (
        <TuneModal
          item={{ label: tuneItem.label, bpm: 120, frequency: 528 }}
          onSave={handleTuneSave}
          onClose={() => setTuneItem(null)}
        />
      )}

      <div className="shelf-section">
        <div className="shelf-section-label">CLASSIFIED FILES</div>
        <RecordShelf
          items={docItems}
          activeId={activeId}
          onSelect={handleSelect}
        />
      </div>

      <StuderTransportBar
        activeTrack={activeTrack}
        transportState={transportState}
        pitchMultiplier={pitchMultiplier}
        onPlay={()   => setTransportState('play')}
        onStop={()   => setTransportState('stop')}
        onRewind={()  => setTransportState('rewind')}
        onFastForward={() => setTransportState('ff')}
        onRecord={()  => setTransportState('record')}
        onPitchChange={setPitchMultiplier}
      />
    </motion.div>
  );
}

export default EarthSafe;
