'use client';

import { useStoreModal } from '@/hooks/use-store-modal';
import { useEffect } from 'react';

export default function SetupPage() {
  const isOpen = useStoreModal(({ isOpen }) => isOpen);
  const onOpen = useStoreModal(({ onOpen }) => onOpen);

  useEffect(() => {
    if (!isOpen) onOpen();
  }, [isOpen, onOpen]);

  return <div></div>;
}
