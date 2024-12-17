'use client';

import { useEffect } from 'react';
import { useStore } from '@/store';

export default function StoreInitializer() {
  useEffect(() => {
    console.log('StoreInitializer mounted, initializing store...');
    useStore.getState().initializeStore();
  }, []);

  return null;
} 