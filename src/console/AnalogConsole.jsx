import React from 'react';
import ArchitectConsole from './ArchitectConsole';

const AnalogConsole = ({ onPowerDown, onNodeSelect, onBroadcast, onIntake }) => {
  return (
    <ArchitectConsole
      onPowerDown={onPowerDown}
      onExplorePlanet={onNodeSelect}
      onBroadcast={onBroadcast}
      onIntake={onIntake}
      viewer="D"
      accent="amber"
    />
  );
};

export default AnalogConsole;