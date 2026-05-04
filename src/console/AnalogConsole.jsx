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
    />
  );
};

export default AnalogConsole;
