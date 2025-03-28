import { useRef, useEffect } from 'react';

/**
 * Hook to track if a component is mounted or not
 * Useful for preventing state updates after component unmount
 */
export function useMountedRef() {
  const mountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  return mountedRef;
} 