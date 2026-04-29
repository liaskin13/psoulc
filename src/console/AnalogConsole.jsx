import React, { useEffect, useRef, useState } from 'react';

// This component will eventually house the entire D Console UI.
// For now, it focuses on implementing the custom cursor and spotlight logic.
const AnalogConsole = () => {
  const cursorRef = useRef(null);
  const spotlightRef = useRef(null);
  const [isDSoulTheme, setIsDSoulTheme] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Effect to monitor theme and motion preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const checkPreferences = () => {
      setIsDSoulTheme(document.body.getAttribute('data-theme') === 'd-soul');
      setPrefersReducedMotion(mediaQuery.matches);
    };

    // Initial check
    checkPreferences();

    // Listen for changes to data-theme attribute on body
    const observer = new MutationObserver(checkPreferences);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

    // Listen for changes to prefers-reduced-motion media query
    mediaQuery.addEventListener('change', checkPreferences);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkPreferences);
    };
  }, []);

  // Effect to handle mouse events for custom cursor and spotlight
  useEffect(() => {
    // Only activate custom cursor logic if d-soul theme is active and motion is preferred
    if (!isDSoulTheme || prefersReducedMotion) {
      return;
    }

    const handleMouseMove = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }
      if (spotlightRef.current) {
        spotlightRef.current.style.left = `${e.clientX}px`;
        spotlightRef.current.style.top = `${e.clientY}px`;
      }
    };

    const handleMouseDown = () => cursorRef.current?.classList.add('clicking');
    const handleMouseUp = () => cursorRef.current?.classList.remove('clicking');

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDSoulTheme, prefersReducedMotion]); // Re-run this effect when these dependencies change

  return (
    <div className="d-monitor">
      {/* Render custom cursor and spotlight only when conditions are met */}
      {isDSoulTheme && !prefersReducedMotion && (
        <>
          <div ref={cursorRef} className="d-cursor"></div>
          <div ref={spotlightRef} className="d-spotlight"></div>
        </>
      )}
      {/* The rest of your AnalogConsole UI will go here */}
      {/* Example: <div className="d-monitor-header">...</div> */}
      {/* Example: <div className="d-monitor-content-area">...</div> */}
      {/* Example: <div className="d-transport">...</div> */}
    </div>
  );
};

export default AnalogConsole;