'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { ProductColumns } from './column';
import { Button } from '@/components/ui/button';
import { Copy, Edit, MoreHorizontal, Trash } from 'lucide-react';
import { useIsClient } from 'usehooks-ts';
import toast from 'react-hot-toast';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayoutParams } from '../../../layout';
import { AlertModal } from '@/components/models/alert-modal';
import { useState } from 'react';
import { useDeleteProduct } from '@/hooks/query/useDeleteProduct';

interface CellActionProps {
  data: ProductColumns;
}

const CellAction: React.FC<CellActionProps> = ({ data: { id: productId } }) => {
  const activeClientEnv = useIsClient();
  const router = useRouter();
  const [deletePromptModalOpen, setDeletePromptModalOpen] = useState(false);

  const { storeId } = useParams() as DashboardLayoutParams;
  const { deleteProduct, deletingProduct } = useDeleteProduct({
    productId,
    storeId,
    onSuccess: () => setDeletePromptModalOpen(false),
    onSettled: () => router.refresh(),
  });

  function onCopySaveToClipboard() {
    if (!activeClientEnv) return;
    navigator.clipboard.writeText(productId);

    toast.success('Size ID copied to clipboard');
  }

  function onBillboardEdit() {
    if (!activeClientEnv) return;
    router.push(`/${storeId}/products/${productId}`);
  }

  return (
    <>
      <AlertModal
        modalOpen={deletePromptModalOpen}
        onClose={() => setDeletePromptModalOpen(false)}
        onConfirm={() => deleteProduct()}
        loading={deletingProduct}
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
