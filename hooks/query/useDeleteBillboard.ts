import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { CONFLICT, NOT_FOUND } from 'http-status';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { MutationActions } from './type';

interface UseDeleteBillboardProps extends MutationActions {
  billboardId: string;
  storeId: string;
}

export const useDeleteBillboard = ({
  billboardId,
  storeId,
  onSuccess,
  onError,
  onSettled,
}: UseDeleteBillboardProps) => {
  const router = useRouter();
  const { mutate: onDeleteBillboard, isLoading: billboardDeleting } =
    useMutation({
      mutationFn: () =>
        axios.delete(`/api/${storeId}/billboards/${billboardId}`),
      onSuccess: () => {
        toast.success('billboard delete successfully');
        onSuccess?.();
      },
      onError: (error) => {
        try {
          if (error instanceof AxiosError) {
            if (error.response) {
              if (error.response.status === NOT_FOUND) {
                return toast.error('Billboard already deleted');
              }
              if (error.response.status === CONFLICT) {
                return toast.error(
                  'You cannot perform delete on this billboard'
                );
              }
            }
          }
          toast.error('Something went wrong while deleting billboard');
        } finally {
          onError?.(error);
        }
      },

      onSettled: () => {
        onSettled?.();
      },
    });

  return { onDeleteBillboard, billboardDeleting };
};
