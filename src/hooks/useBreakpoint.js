import { useState, useEffect } from 'react';

const BP = { xs: 480, sm: 768, md: 1024, lg: 1440 };

const getBreakpoint = (w) => {
  if (w < BP.xs) return 'xs';
  if (w < BP.sm) return 'sm';
  if (w < BP.md) return 'md';
  if (w < BP.lg) return 'lg';
  return 'xl';
};

/**
 * Returns current named breakpoint + convenience booleans.
 * Uses matchMedia change events — no resize listener overhead.
 *
 * @returns {{ bp: string, isMobile: boolean, isTablet: boolean, isDesktop: boolean }}
 */
export const useBreakpoint = () => {
  const [bp, setBp] = useState(() => getBreakpoint(window.innerWidth));

  useEffect(() => {
    const update = () => setBp(getBreakpoint(window.innerWidth));
    const mql = window.matchMedia(`(max-width: ${BP.md - 1}px)`);
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  return {
    bp,
    isMobile:  bp === 'xs' || bp === 'sm',
    isTablet:  bp === 'md',
    isDesktop: bp === 'lg' || bp === 'xl',
  };
};
