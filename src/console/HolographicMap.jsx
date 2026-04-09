import React from 'react';
import { useSystem } from '../state/SystemContext';
import EmpireNode from './EmpireNode';
import BinaryCore3D from './BinaryCore3D';
import { PLANET_NODES } from '../data/nodes';

function HolographicMap({ activeNode, onNodeSelect, onNodeLongPress, saturnMoons, onMoonSync }) {
  const { isProtected } = useSystem();

  return (
    <div className={`holographic-map ${isProtected ? 'protected' : 'create'}`}>
      {/* Amber dashed orbital path rings — tactical radar tracks */}
      <div className="orbit-path orbit-path-inner" />
      <div className="orbit-path orbit-path-mid" />
      <div className="orbit-path orbit-path-outer" />

      <BinaryCore3D onSelect={onNodeSelect} />

      {PLANET_NODES.map(node => (
        <EmpireNode
          key={node.id}
          node={node}
          onSelect={onNodeSelect}
          onLongPress={onNodeLongPress}
          isActive={activeNode?.id === node.id}
          saturnMoons={saturnMoons}
          onMoonSync={onMoonSync}
        />
      ))}
    </div>
  );
}

export default HolographicMap;
