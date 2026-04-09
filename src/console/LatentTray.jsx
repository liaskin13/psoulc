import React from 'react';

function LatentTray({ latentNodes, onClaimNode }) {
  return (
    <div className="latent-tray">
      <h3>LATENT</h3>
      {latentNodes.map(node => (
        <div
          key={node.id}
          className="latent-node"
          onClick={() => onClaimNode(node)}
        >
          {node.label}
        </div>
      ))}
    </div>
  );
}

export default LatentTray;
