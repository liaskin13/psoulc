import React from 'react';
import { useSystem } from '../state/SystemContext';
import GodModePullCord from './GodModePullCord';
import MasterClock from './MasterClock';
import HolographicMap from './HolographicMap';
import ConduitSlider from './ConduitSlider';
import AssetIntakeSlot from './AssetIntakeSlot';
import LatentTray from './LatentTray';
function AnalogConsole({
  activeNode,
  onNodeSelect,
  onNodeLongPress,
  onClaimNode,
  onBroadcast,
  onIntake,
  isBroadcasting,
  saturnMoons,
  onMoonSync
}) {
  const { isProtected } = useSystem();

  return (
    <div className={`analog-console ${isProtected ? 'protected' : 'create'}`}>
      <GodModePullCord />

      <div className="console-center">
        <MasterClock />
        <div className="console-pit">
        <HolographicMap
          activeNode={activeNode}
          onNodeSelect={onNodeSelect}
          onNodeLongPress={onNodeLongPress}
          saturnMoons={saturnMoons}
          onMoonSync={onMoonSync}
        />
        </div>
      </div>

      <div className="console-right">
        <ConduitSlider onBroadcast={onBroadcast} isBroadcasting={isBroadcasting} />
        <AssetIntakeSlot onIntake={onIntake} />
        <LatentTray latentNodes={[]} onClaimNode={onClaimNode} />
      </div>
    </div>
  );
}

export default AnalogConsole;
