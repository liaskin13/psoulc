import React from 'react';
import { LOCKBOX_PREFIX } from '../config';

const LOCKBOX_COLORS = {
  janet:  '#cc3399',
  erikah: '#cc6633',
  larry:  '#7aaa5a',
  drake:  '#c4a428',
};

function LockedDoor({ lockboxId, onBack }) {
  const key = (lockboxId || '').replace(LOCKBOX_PREFIX, '');
  const name = key.toUpperCase();
  const color = LOCKBOX_COLORS[key] ?? '#555555';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#050505',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem',
        fontFamily: '"Chakra Petch", monospace',
        zIndex: 100,
      }}
    >
      <div
        style={{
          width: '2px',
          height: '48px',
          background: color,
          opacity: 0.7,
        }}
      />
      <div
        style={{
          fontSize: '0.65rem',
          letterSpacing: '0.35em',
          color: color,
          opacity: 0.6,
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontSize: '2rem',
          letterSpacing: '0.25em',
          color: '#ffffff',
          opacity: 0.12,
          fontWeight: 700,
        }}
      >
        SEALED
      </div>
      <div
        style={{
          width: '2px',
          height: '48px',
          background: color,
          opacity: 0.7,
        }}
      />
      <button
        onClick={onBack}
        style={{
          marginTop: '1rem',
          background: 'transparent',
          border: `1px solid ${color}`,
          color: color,
          fontFamily: '"Chakra Petch", monospace',
          fontSize: '0.6rem',
          letterSpacing: '0.3em',
          padding: '0.5rem 1.5rem',
          cursor: 'pointer',
          opacity: 0.6,
        }}
      >
        RETURN
      </button>
    </div>
  );
}

export default LockedDoor;
