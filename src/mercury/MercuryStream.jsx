import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import RecordShelf from '../components/RecordShelf';
import StuderTransportBar from '../components/StuderTransportBar';
import VaultWindow from '../components/VaultWindow';
import VoidStreakOverlay from '../components/VoidStreakOverlay';
import { useVaultVoid } from '../hooks/useVaultVoid';
import { useVaultFileCells } from '../hooks/useVaultFileCells';
import { MERCURY_TRACKS } from '../data/mercury';
import { VOID_CHAKRA_COLORS, MEMBER_CHAKRA_COLORS } from '../config';
import { useSystem } from '../state/SystemContext';
import { canComment, canEdit } from '../utils/permissions';

// Mercury chrome palette — liquid signal conduit
const CHROME = { highlight: '#e8f4ff', base: '#6a8caa', shadow: '#0a1420', glow: 'rgba(140,200,255,0.7)' };

const TRACK_ITEMS = MERCURY_TRACKS.map(t => ({
  id: `track-${t.id}`, label: t.name,
  sublabel: `${t.bpm} BPM · ${t.frequency}Hz`,
  metadata: t,
  createdBy: t.createdBy || 'D',
  chakraColor: MEMBER_CHAKRA_COLORS[t.createdBy] || MEMBER_CHAKRA_COLORS.D,
  ...CHROME,
}));

function MercuryStream({ onBack, onExitSystem, onVoid, readOnly = false }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  const [pitchMultiplier, setPitchMultiplier]  = useState(1.0);

  const {
    cells: trackItems,
    activeId,
    activeTrack,
    transportState,
    selectCell,
    findCellById,
    removeCell,
    clearSelection,
    setTransport,
  } = useVaultFileCells(TRACK_ITEMS);

  const {
    vaultWindowRef,
    voidProps,
    inverseBloom,
    isVoidArmed,
    armedVoidLabel,
    cancelArmedVoid,
    confirmArmedVoid,
    handleShelfVoid,
    handleVoidButton,
  } =
    useVaultVoid({
      voidColor: VOID_CHAKRA_COLORS.mercury,
      onVoid: (item) => {
        removeCell(item.id);
        onVoid?.(item);
      },
    });

  const { addComment, sessionMeta } = useSystem();
  const handleComment = (item, body) => addComment('mercury', item.id, item.label, sessionMeta?.owner || 'member', body);
  const canAdmin = canEdit(sessionMeta, 'mercury');

  const handleSelect = item => {
    selectCell(item);
  };

  // Ambient waveform — low opacity background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let t = 0;

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      const drawWave = (ampScale, freqMod, speedMod, alpha, lineWidth) => {
        const grad = ctx.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0,   `rgba(160,200,240,${alpha * 0.4})`);
        grad.addColorStop(0.3, `rgba(220,240,255,${alpha})`);
        grad.addColorStop(0.6, `rgba(180,220,255,${alpha * 0.8})`);
        grad.addColorStop(1,   `rgba(120,170,220,${alpha * 0.3})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = lineWidth;
        ctx.shadowColor = `rgba(160,220,255,${alpha * 0.3})`;
        ctx.shadowBlur  = 6;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 2) {
          const nx = x / W;
          const y  = H / 2
            + Math.sin(nx * 6  * freqMod + t * speedMod)       * (H * 0.22 * ampScale)
            + Math.sin(nx * 14 * freqMod + t * speedMod * 1.4) * (H * 0.10 * ampScale)
            + Math.sin(nx * 3  * freqMod + t * speedMod * 0.6) * (H * 0.15 * ampScale);
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      };

      drawWave(1.0, 1,   1,    0.18, 1.2);
      drawWave(0.5, 1.6, 1.25, 0.10, 0.8);
      drawWave(0.3, 0.7, 0.75, 0.07, 0.6);

      t += 0.018;
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Mercury glow: inherits the soul-chakra of whoever is currently broadcasting.
  // When D is live = Solar Gold. When another member broadcasts = their color.
  const broadcasterGlow = (() => {
    const owner = sessionMeta?.owner;
    const color = owner ? (MEMBER_CHAKRA_COLORS[owner] || null) : null;
    return color ? `${color}1a` : 'transparent';
  })();

  return (
    <motion.div
      className="vault-screen mercury-stream"
      style={{ '--vault-owner-glow': broadcasterGlow }}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.08, 0, 0.3, 1] }}
    >
      <div className="vault-header">
        <h1 className="vault-title">MERCURY</h1>
        <p className="vault-subtitle">LIVE SETS · HIGH-VELOCITY CONDUIT</p>
      </div>

      <div className="vault-commands">
        <button className="god-btn" onClick={onBack}>SEAL VAULT</button>
        <button className="god-btn" onClick={onExitSystem}>EXIT SYSTEM</button>
        {!readOnly && (
          <button
            className="god-btn"
              onClick={() => activeId && handleVoidButton(findCellById(activeId))}
            disabled={!activeId}
            style={{ opacity: activeId ? 1 : 0.4 }}
          >
            VOID
          </button>
        )}
      </div>

      <div className="vault-main-grid">
        <div className="vault-top-band">
          <VaultWindow
            ref={vaultWindowRef}
            inverseBloom={inverseBloom}
            voidArmed={isVoidArmed}
            armedLabel={armedVoidLabel}
            onCancelVoid={cancelArmedVoid}
            onConfirmVoid={confirmArmedVoid}
          />
        </div>

        <div className="vault-library-band">
          {/* Ambient waveform canvas — behind shelf */}
          <div className="mercury-waveform-housing mercury-ambient">
            <canvas ref={canvasRef} className="mercury-canvas" />
          </div>

          <div className="shelf-section">
            <div className="shelf-section-label">LIVE ARCHIVE</div>
            <RecordShelf
              items={trackItems}
              activeId={activeId}
              onSelect={handleSelect}
              onVoid={readOnly ? undefined : handleShelfVoid}
              onComment={canComment(sessionMeta) ? handleComment : undefined}
            />
          </div>

          <StuderTransportBar
            activeTrack={activeTrack}
            transportState={transportState}
            pitchMultiplier={pitchMultiplier}
            onPlay={()          => setTransport('play')}
            onStop={()          => setTransport('stop')}
            onRewind={()        => setTransport('rewind')}
            onFastForward={()   => setTransport('ff')}
            onPause={()         => setTransport('pause')}
            onRecord={()        => setTransport('record')}
            showAdminCommands={!readOnly}
            isAdmin={canAdmin}
            onAdminArm={()    => activeId && handleVoidButton(findCellById(activeId))}
            onAdminCommit={confirmArmedVoid}
            onAdminSeal={()   => { cancelArmedVoid(); setTransport('stop'); }}
            onAdminClear={clearSelection}
            onPitchChange={setPitchMultiplier}
          />
        </div>
      </div>

      {!readOnly && <VoidStreakOverlay {...voidProps} />}
    </motion.div>
  );
}

export default MercuryStream;
