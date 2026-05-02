import { useMemo, useState, useCallback, useEffect } from 'react';

function normalizeCells(items) {
  return (items || []).map((item) => ({
    ...item,
    selected: Boolean(item.selected),
    playState: item.playState || 'idle',
  }));
}

export function useVaultFileCells(initialItems, resetToken = null) {
  const [cells, setCells] = useState(() => normalizeCells(initialItems));
  const [activeId, setActiveId] = useState(() => {
    const selected = (initialItems || []).find((item) => item.selected);
    return selected?.id || null;
  });
  const [transportState, setTransportState] = useState('stop');

  useEffect(() => {
    if (resetToken === null || resetToken === undefined) return;
    const nextCells = normalizeCells(initialItems);
    const selected = (initialItems || []).find((item) => item.selected);
    setCells(nextCells);
    setActiveId(selected?.id || null);
    setTransportState('stop');
  }, [initialItems, resetToken]);

  const selectCell = useCallback((itemOrId) => {
    const id = typeof itemOrId === 'string' ? itemOrId : itemOrId?.id;
    if (!id) return;
    setActiveId(id);
    setTransportState('stop');
    setCells((prev) => prev.map((cell) => ({
      ...cell,
      selected: cell.id === id,
      playState: cell.id === id ? 'stop' : 'idle',
    })));
  }, []);

  const findCellById = useCallback((id) => {
    if (!id) return null;
    return cells.find((cell) => cell.id === id) || null;
  }, [cells]);

  const updateCell = useCallback((id, updater) => {
    if (!id) return;
    setCells((prev) => prev.map((cell) => {
      if (cell.id !== id) return cell;
      return typeof updater === 'function' ? updater(cell) : { ...cell, ...updater };
    }));
  }, []);

  const removeCell = useCallback((id) => {
    if (!id) return;
    setCells((prev) => prev.filter((cell) => cell.id !== id));
    setActiveId((prev) => (prev === id ? null : prev));
    setTransportState((prev) => (activeId === id ? 'stop' : prev));
  }, [activeId]);

  const clearSelection = useCallback(() => {
    setActiveId(null);
    setTransportState('stop');
    setCells((prev) => prev.map((cell) => ({ ...cell, selected: false, playState: 'idle' })));
  }, []);

  const setTransport = useCallback((nextState) => {
    setTransportState(nextState);
    setCells((prev) => prev.map((cell) => {
      if (!activeId) return { ...cell, playState: 'idle' };
      if (cell.id === activeId) return { ...cell, playState: nextState };
      return cell.playState === 'idle' ? cell : { ...cell, playState: 'idle' };
    }));
  }, [activeId]);

  const activeCell = useMemo(
    () => (activeId ? cells.find((cell) => cell.id === activeId) || null : null),
    [activeId, cells],
  );

  const activeTrack = useMemo(() => {
    if (!activeCell) return null;
    return {
      label: activeCell.label,
      sublabel: activeCell.sublabel,
    };
  }, [activeCell]);

  return {
    cells,
    activeId,
    activeCell,
    activeTrack,
    transportState,
    selectCell,
    findCellById,
    updateCell,
    removeCell,
    clearSelection,
    setTransport,
  };
}
