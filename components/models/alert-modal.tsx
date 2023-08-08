'use client';

import { useIsMounted } from 'usehooks-ts';
import { Modal } from '@/ui/modal';
import { Button } from '@/ui/button';

interface AlertModalProps {
  modalOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  modalOpen,
  loading,
  onClose,
  onConfirm,
}) => {
  const mounted = useIsMounted();
  if (!mounted()) return null;

  return (
    <Modal
      title="Are you sure"
      description="This action cannot be undone"
      isOpen={modalOpen}
      onClose={onClose}
    >
      <div className="pt-6 space-x-2 flex items-center justify-end w-full">
        <Button disabled={loading} variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={loading} variant="destructive" onClick={onConfirm}>
          Continue
        </Button>
      </div>
    </Modal>
  );
};
