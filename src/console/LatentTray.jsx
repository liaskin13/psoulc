import React from 'react';

function LatentTray({ latentNodes, onClaimNode }) {
  return (
    <div className="latent-tray">
      <h3>LATENT</h3>
      {latentNodes.map(node => (
        <div
          key={node.id}
          className="latent-node"
          role="button"
          tabIndex={0}
          onClick={() => onClaimNode(node)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onClaimNode(node);
            }
          }}
        >
          {node.label}
          <span className="latent-meta">
            {(node.size || 0) > 0 ? `${Math.max(1, Math.round(node.size / 1024))} KB` : 'UNSIZED'}
            {node.targetPlanet ? ` • TARGET ${node.targetPlanet.toUpperCase()}` : ' • UNASSIGNED'}
          </span>
        </div>
      ))}
    </div>
  );
}

export default LatentTray;
