import { useState, useEffect } from 'react';

/**
 * Returns whether the browser currently has a network connection.
 * Updates reactively when connectivity changes.
 */
export const useNetworkStatus = () => {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online',  on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return online;
};
