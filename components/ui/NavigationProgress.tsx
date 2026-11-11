'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // When pathname or searchParams change, the navigation has completed
  useEffect(() => {
    if (isLoading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept clicks on links that trigger internal page transitions
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a') as HTMLAnchorElement | null;

      if (!anchor || !anchor.href) return;

      const targetUrl = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);

      // Check if it is same-origin, not download, not open in new tab
      const isSameOrigin = targetUrl.origin === currentUrl.origin;
      const isTargetBlank = anchor.target === '_blank';
      const isModifierKey = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
      const isHashChange =
        targetUrl.pathname === currentUrl.pathname &&
        targetUrl.search === currentUrl.search &&
        targetUrl.hash !== currentUrl.hash;

      if (isSameOrigin && !isTargetBlank && !isModifierKey && !isHashChange) {
        // Only trigger if moving to a different URL
        if (targetUrl.pathname !== currentUrl.pathname || targetUrl.search !== currentUrl.search) {
          setIsLoading(true);
          setProgress(25);

          // Gradually increase progress while waiting
          const t1 = setTimeout(() => setProgress((p) => (p < 70 ? 70 : p)), 100);
          const t2 = setTimeout(() => setProgress((p) => (p < 88 ? 88 : p)), 350);

          return () => {
            clearTimeout(t1);
            clearTimeout(t2);
          };
        }
      }
    };

    document.addEventListener('click', handleAnchorClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleAnchorClick, { capture: true });
    };
  }, []);

  if (!isLoading && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-opacity duration-300"
      style={{ opacity: isLoading || progress === 100 ? 1 : 0 }}
    >
      {/* Sleek Gradient Bar */}
      <div
        className="h-[3px] bg-gradient-to-r from-emerald-800 via-emerald-500 to-amber-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(5,150,105,0.7)]"
        style={{ width: `${progress}%` }}
      />
      
      {/* Glowing tip */}
      <div
        className="absolute top-0 right-0 -mr-2 w-8 h-[3px] bg-amber-400 blur-[2px] transition-all duration-300"
        style={{
          left: `calc(${progress}% - 32px)`,
          opacity: progress > 0 && progress < 100 ? 1 : 0,
        }}
      />
    </div>
  );
}
