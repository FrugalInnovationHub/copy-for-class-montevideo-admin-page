import { useState, useEffect } from 'react';

function useIsMobile() {
  // Tailwind "md" starts at 768px, so mobile is below that.
  const mq = '(max-width: 767px)';
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(mq).matches
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(mq);
    const handler = e => setIsMobile(e.matches);

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

export default useIsMobile;