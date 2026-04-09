import React, { useState } from 'react';
import { motion } from 'framer-motion';
import RecordShelf from '../components/RecordShelf';
import StuderTransportBar from '../components/StuderTransportBar';
import TuneModal from '../components/TuneModal';
import { SATURN_TRACKS, SATURN_MOONS } from '../data/saturn';

// Saturn spine palette — metallic gold, warm light from the left (Sun).
const GOLD = { highlight: '#fff0b0', base: '#c89030', shadow: '#3a1e00', glow: 'rgba(220,160,40,0.7)' };

// Moon spine palette — per-moon chakra tones.
const MOON_PALETTE = {
  janet:  { highlight: '#fff2cc', base: '#d4a020', shadow: '#3a1800', glow: 'rgba(212,160,32,0.7)'  },
  erikah: { highlight: '#c0e8ff', base: '#3a88cc', shadow: '#001830', glow: 'rgba(58,136,204,0.7)'  },
  drake:  { highlight: '#ffeebb', base: '#c09010', shadow: '#302000', glow: 'rgba(192,144,16,0.7)'  },
  larry:  { highlight: '#e0bbff', base: '#8830c0', shadow: '#200030', glow: 'rgba(136,48,192,0.7)'  },
};

// Map Saturn tracks to RecordShelf item shape.
const TRACK_ITEMS = SATURN_TRACKS.map(t => ({
  id:       `track-${t.id}`,
  label:    t.name,
  sublabel: `${t.bpm} BPM · ${t.frequency}`,
  metadata: t,
  ...GOLD,
}));

// Map Saturn moons to RecordShelf item shape.
const MOON_ITEMS = SATURN_MOONS.map(m => ({
  id:       `moon-${m.id}`,
  label:    m.name,
  sublabel: `${m.frequency}Hz`,
  metadata: m,
  ...(MOON_PALETTE[m.id] || GOLD),
}));

function SaturnVault({ onVoid, onBack }) {
  const [activeId,        setActiveId]        = useState(null);
  const [activeTrack,     setActiveTrack]     = useState(null);
  const [transportState,  setTransportState]  = useState('stop');
  const [pitchMultiplier, setPitchMultiplier] = useState(1.0);
  const [voidLog,         setVoidLog]         = useState([]);
  const [tuneItem,        setTuneItem]        = useState(null); // item currently being tuned
  const [trackItems,      setTrackItems]      = useState(TRACK_ITEMS);

  const handleSelect = item => {
    setActiveId(item.id);
    setActiveTrack({ label: item.label, sublabel: item.sublabel });
    setTransportState('stop');
  };

  const handleVoid = item => {
    setVoidLog(prev => [...prev, item]);
    if (activeId === item.id) { setActiveId(null); setActiveTrack(null); }
    onVoid(item);
  };

  const handleTune = () => {
    if (!activeId) return;
    const item = trackItems.find(i => i.id === activeId);
    if (item) setTuneItem(item);
  };

  const handleTuneSave = (updates) => {
    setTrackItems(prev => prev.map(i =>
      i.id === tuneItem.id
        ? { ...i, label: updates.label, sublabel: `${updates.bpm} BPM · ${updates.frequency}Hz`, metadata: { ...i.metadata, bpm: updates.bpm, frequency: `${updates.frequency}Hz` } }
        : i
    ));
    if (activeId === tuneItem.id) {
      setActiveTrack({ label: updates.label, sublabel: `${updates.bpm} BPM · ${updates.frequency}Hz` });
    }
    setTuneItem(null);
  };

  return (
    <motion.div
      className="vault-screen saturn-vault"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.08, 0, 0.3, 1] }}
    >
      <div className="vault-header">
        <h1 className="vault-title">SATURN</h1>
        <p className="vault-subtitle">ORIGINAL MUSIC · BRUSHED STEEL ARCHIVE</p>
      </div>

      <div className="vault-commands">
        <button className="god-btn" onClick={onBack}>← BACK</button>
        <button className="god-btn" onClick={handleTune} disabled={!activeId} style={{ opacity: activeId ? 1 : 0.4 }}>TUNE</button>
        <button className="god-btn" onClick={() => activeId && handleVoid({ id: activeId, label: activeTrack?.label })} disabled={!activeId} style={{ opacity: activeId ? 1 : 0.4 }}>
          VOID
        </button>
      </div>

      {/* TUNE modal — opens when TUNE is clicked with an active selection */}
      {tuneItem && (
        <TuneModal
          item={{ label: tuneItem.label, bpm: tuneItem.metadata?.bpm, frequency: parseInt(tuneItem.metadata?.frequency) || 528 }}
          onSave={handleTuneSave}
          onClose={() => setTuneItem(null)}
        />
      )}

      {/* Master Tracks shelf */}
      <div className="shelf-section">
        <div className="shelf-section-label">MASTERS</div>
        <RecordShelf
          items={trackItems}
          activeId={activeId}
          onSelect={handleSelect}
          onVoid={handleVoid}
        />
      </div>

      {/* Moon collaborators shelf */}
      <div className="shelf-section">
        <div className="shelf-section-label">MOONS</div>
        <RecordShelf
          items={MOON_ITEMS}
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

      {voidLog.length > 0 && (
        <div className="void-log">
          {voidLog.map((item, i) => (
            <div key={i} className="voided-item">
              <span className="void-icon">●</span> {item.label}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default SaturnVault;
