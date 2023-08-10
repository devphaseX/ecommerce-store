'use client';
import { useIsMounted } from 'usehooks-ts';

import { StoreModal } from '@/components/models/store-modal';
import { useStoreModal } from '@/hooks/use-store-modal';

export const ModalProvider = () => {
  const isMounted = useIsMounted();
  const storeModal = useStoreModal();

  if (!(isMounted() && storeModal.isOpen)) return null;
  return (
    <>
      <StoreModal />
    </>
  );
};
