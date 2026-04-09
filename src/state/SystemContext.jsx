import React, { createContext, useContext, useState } from 'react';

// Global system state — Binary Sovereignty v2
// Pull Cord, console identity, void archive, and broadcast signal.
// Any component in the tree can read or toggle without prop drilling.

const SystemContext = createContext(null);

export function SystemProvider({ children }) {
  const [isProtected,    setIsProtected]    = useState(false);
  const [consoleOwner,   setConsoleOwner]   = useState(null);     // 'D' | 'L' | null
  const [voidedItems,    setVoidedItems]    = useState([]);       // items voided from Sun vaults
  const [architectArchive, setArchitectArchive] = useState([]);  // items stored in Black Star

  const toggleProtected = () => setIsProtected(prev => !prev);

  // Void an item — moves it from active vault to Black Star Archive
  const voidItem = (item, originPlanet) => {
    const record = {
      ...item,
      originPlanet,
      voidedAt: new Date().toISOString(),
      id: item.id || `void-${Date.now()}`,
    };
    setVoidedItems(prev => [...prev, record]);
    setArchitectArchive(prev => [...prev, record]);
  };

  // Restore an item — Architect-only, pushes back to Sun vault (marked as restored)
  const restoreItem = (itemId) => {
    setArchitectArchive(prev => prev.map(item =>
      item.id === itemId ? { ...item, restored: true, restoredAt: new Date().toISOString() } : item
    ));
    setVoidedItems(prev => prev.filter(item => item.id !== itemId));
  };

  return (
    <SystemContext.Provider value={{
      isProtected, toggleProtected,
      consoleOwner, setConsoleOwner,
      voidedItems,
      architectArchive,
      voidItem,
      restoreItem,
    }}>
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  return useContext(SystemContext);
}
