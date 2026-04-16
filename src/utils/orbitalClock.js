// Shared orbital time — written by SpaceWindow's useFrame, read by SystemMap2D's RAF.
// Using a plain mutable object (not React state) avoids 60fps re-renders of every
// SystemContext consumer. Both systems read the same reference each animation frame.
export const orbitalClock = { t: 0 };
