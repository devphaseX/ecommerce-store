import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { CONFLICT, NOT_FOUND } from 'http-status';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { MutationActions } from './type';
import {
  ParamWithSizeId,
  ParamWithStoreId,
} from '@/app/api/(params)/params-schema';

interface useDeleteSizeProps
  extends MutationActions,
    ParamWithSizeId,
    ParamWithStoreId {}

export const useDeleteSize = ({
  storeId,
  sizeId,
  onSuccess,
  onError,
  onSettled,
}: useDeleteSizeProps) => {
  const router = useRouter();
  const { mutate: onDeleteSize, isLoading: sizeDeleting } = useMutation({
    mutationFn: () => axios.delete(`/api/stores/${storeId}/sizes/${sizeId}`),
    onSuccess: () => {
      toast.success('Size delete successfully');
      onSuccess?.();
    },
    onError: (error) => {
      try {
        if (error instanceof AxiosError) {
          if (error.response) {
            if (error.response.status === NOT_FOUND) {
              return toast.error('Size already deleted');
            }
            if (error.response.status === CONFLICT) {
              return toast.error('You cannot perform delete on this size');
            }
          }
        }
        toast.error('Something went wrong while deleting size');
      } finally {
        onError?.(error);
      }
    },

    onSettled: () => {
      onSettled?.();
    },
  });

  return { onDeleteSize, sizeDeleting };
};
