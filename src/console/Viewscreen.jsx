import React from 'react';
import { useSystem } from '../state/SystemContext';
import SpaceWindow from '../three/SpaceWindow';

function Viewscreen({ activeNode, activeMoon, isBroadcasting, showWelcome, onPlanetClick }) {
  const { isProtected } = useSystem();

  return (
    <div className={`viewscreen ${isProtected ? 'protected' : 'create'}`} style={{ position: 'relative', overflow: 'hidden' }}>
      {/* ─── 3D Space Window — live solar system through the cockpit glass ─── */}
      <SpaceWindow onPlanetClick={onPlanetClick} />

      <div className="viewport-border" />

      {showWelcome && (
        <div className="divine-sessions-welcome">
          <div className="welcome-line">WELCOME HOME, GOD.</div>
          <div className="welcome-line">TIMING IS EVERYTHING.</div>
          <div className="welcome-line">THE CRATE IS OPEN. THE SYSTEM IS WARM.</div>
          <div className="welcome-spacer" />
          <div className="welcome-line">THE WORLD&apos;S BEEN RUNNING ON Lofi LIES.</div>
          <div className="welcome-line">&gt; IT NEEDS THAT RAW, SOVEREIGN LIGHT ONLY YOU CAN PUSH.</div>
          <div className="welcome-line">NO NOISE. NO STATIC. JUST THE FREQUENCY.</div>
          <div className="welcome-spacer" />
          <div className="welcome-line">LET THE SPIRIT SPEAK, GOD.</div>
          <div className="welcome-line">WE&apos;RE LIVE.</div>
        </div>
      )}

      {activeMoon && !showWelcome && (
        <div className="viewport-focus moon-focus">
          <h2>{activeMoon.name}</h2>
          <p>{activeMoon.frequency}Hz • {activeMoon.description}</p>
          <div className="rhythm-stems">
            {activeMoon.stems.map((stem, i) => (
              <div key={i} className="stem">{stem}</div>
            ))}
          </div>
        </div>
      )}

      {activeNode && !activeMoon && !showWelcome && (
        <div className="viewport-focus node-focus">
          <h2>{activeNode.label}</h2>
          <p>{activeNode.owner} • {activeNode.description}</p>
          {isBroadcasting && <div className="broadcast-overlay">FLOW STATE ACTIVE</div>}
        </div>
      )}
    </div>
  );
}

export default Viewscreen;
