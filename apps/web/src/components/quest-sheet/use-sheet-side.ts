'use client';

import { useEffect, useState } from 'react';

export function useSheetSide(): 'bottom' | 'right' {
  const [side, setSide] = useState<'bottom' | 'right'>('bottom');

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setSide(mq.matches ? 'right' : 'bottom');
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return side;
}
