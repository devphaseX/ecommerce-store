'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { SizeColumns } from './column';
import { Button } from '@/components/ui/button';
import { Copy, Edit, MoreHorizontal, Trash } from 'lucide-react';
import { useIsClient } from 'usehooks-ts';
import toast from 'react-hot-toast';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayoutParams } from '../../../layout';
import { AlertModal } from '@/components/models/alert-modal';
import { useState } from 'react';
import { useDeleteBillboard } from '@/hooks/query/useDeleteBillboard';

interface CellActionProps {
  data: SizeColumns;
}

const CellAction: React.FC<CellActionProps> = ({
  data: { id: billboardId },
}) => {
  const activeClientEnv = useIsClient();
  const router = useRouter();
  const [deletePromptModalOpen, setDeletePromptModalOpen] = useState(false);

  const { storeId } = useParams() as DashboardLayoutParams;
  const { billboardDeleting, onDeleteBillboard } = useDeleteBillboard({
    billboardId,
    storeId,
    onSuccess: () => setDeletePromptModalOpen(false),
    onSettled: () => router.refresh(),
  });

  function onCopySaveToClipboard() {
    if (!activeClientEnv) return;
    navigator.clipboard.writeText(billboardId);

    toast.success('Billboard ID copied to clipboard');
  }

  function onBillboardEdit() {
    if (!activeClientEnv) return;
    router.push(`/${storeId}/billboards/${billboardId}`);
  }

  return (
    <>
      <AlertModal
        modalOpen={deletePromptModalOpen}
        onClose={() => setDeletePromptModalOpen(false)}
        onConfirm={() => onDeleteBillboard()}
        loading={billboardDeleting}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem className="mb-2" onClick={onCopySaveToClipboard}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </DropdownMenuItem>
          <DropdownMenuItem className="mb-2" onClick={onBillboardEdit}>
            <Edit className="mr-2  h-4 w-4" />
            Update
          </DropdownMenuItem>

          <DropdownMenuItem
            className="mb-2"
            onClick={() => setDeletePromptModalOpen(true)}
          >
            <Trash className="mr-2  h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export { CellAction };
