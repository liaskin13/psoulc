import React, { useState } from 'react';
import { motion } from 'framer-motion';
import RecordShelf from '../components/RecordShelf';
import StuderTransportBar from '../components/StuderTransportBar';
import TuneModal from '../components/TuneModal';
import { VENUS_MIXES } from '../data/venus';

// Venus spine palette — dusty rose, warm light from the left.
const ROSE = { highlight: '#ffd8d8', base: '#b06060', shadow: '#4a0a0a', glow: 'rgba(200,100,100,0.7)' };

const MIX_ITEMS = VENUS_MIXES.map(m => ({
  id:       `mix-${m.id}`,
  label:    m.title,
  sublabel: `${m.duration} · ${m.frequency} · ${m.date}`,
  metadata: m,
  ...ROSE,
}));

function VenusArchive({ onBack, onVoid }) {
  const [activeId,        setActiveId]        = useState(null);
  const [activeTrack,     setActiveTrack]     = useState(null);
  const [transportState,  setTransportState]  = useState('stop');
  const [pitchMultiplier, setPitchMultiplier] = useState(1.0);
  const [tuneItem,        setTuneItem]        = useState(null);
  const [mixItems,        setMixItems]        = useState(MIX_ITEMS);

  const handleSelect = item => {
    setActiveId(item.id);
    setActiveTrack({ label: item.label, sublabel: item.sublabel });
    setTransportState('stop');
  };

  const handleTune = () => {
    if (!activeId) return;
    const item = mixItems.find(i => i.id === activeId);
    if (item) setTuneItem(item);
  };

  const handleTuneSave = (updates) => {
    setMixItems(prev => prev.map(i =>
      i.id === tuneItem.id
        ? { ...i, label: updates.label, sublabel: `${i.metadata?.duration || ''} · ${updates.frequency}Hz · ${i.metadata?.date || ''}` }
        : i
    ));
    if (activeId === tuneItem.id) {
      setActiveTrack(prev => ({ ...prev, label: updates.label }));
    }
    setTuneItem(null);
  };

  const handleVoid = () => {
    if (!activeId) return;
    const item = mixItems.find(i => i.id === activeId);
    if (item && onVoid) {
      onVoid({ id: item.id, label: item.label, sublabel: item.sublabel });
      setMixItems(prev => prev.filter(i => i.id !== activeId));
      setActiveId(null);
      setActiveTrack(null);
    }
  };

  return (
    <motion.div
      className="vault-screen venus-archive"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.08, 0, 0.3, 1] }}
    >
      <div className="vault-header">
        <h1 className="vault-title">VENUS</h1>
        <p className="vault-subtitle">CURATED MIXES · 120-MINUTE DEEP STORAGE</p>
      </div>

      <div className="vault-commands">
        <button className="god-btn" onClick={onBack}>← BACK</button>
        <button className="god-btn" onClick={handleTune}  disabled={!activeId} style={{ opacity: activeId ? 1 : 0.4 }}>TUNE</button>
        <button className="god-btn" onClick={handleVoid} disabled={!activeId} style={{ opacity: activeId ? 1 : 0.4 }}>VOID</button>
      </div>

      {tuneItem && (
        <TuneModal
          item={{ label: tuneItem.label, bpm: tuneItem.metadata?.bpm || 120, frequency: tuneItem.metadata?.frequency || 528 }}
          onSave={handleTuneSave}
          onClose={() => setTuneItem(null)}
        />
      )}

      <div className="shelf-section">
        <div className="shelf-section-label">ARCHIVES</div>
        <RecordShelf
          items={mixItems}
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

export default VenusArchive;
