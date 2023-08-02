'use client';
import { useIsMounted } from 'usehooks-ts';

import { StoreModal } from '@/components/models/store-modal';

export const ModalProvider = () => {
  const isMounted = useIsMounted();

  if (!isMounted) return null;

  return (
    <>
      <StoreModal />
    </>
  );
};
