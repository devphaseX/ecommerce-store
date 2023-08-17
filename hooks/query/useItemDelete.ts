import { useMutation } from '@tanstack/react-query';
import { MutationActions } from './type';
import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { CONFLICT, NOT_FOUND } from 'http-status';

export interface UseDeleteItemProps extends MutationActions {
  storeId: string;
  routeName?: string;
  itemPathName?: string;
}

export const useDeleteItem = ({
  storeId,
  onError,
  onSettled,
  onSuccess,
  routeName,
  itemPathName,
}: UseDeleteItemProps) => {
  const { isLoading, mutate } = useMutation({
    mutationFn: async () => {
      if (storeId && routeName && itemPathName) {
        return axios.delete(`/api/${storeId}/${routeName}/${itemPathName}`);
      }
    },
    onSuccess: () => {
      toast.success(`Category {${routeName}} delete succesfully`);
      onSuccess?.();
    },

    onError: (error) => {
      try {
        if (error instanceof AxiosError) {
          if (error.response) {
            if (error.response.status === NOT_FOUND) {
              return toast.error(`${routeName} already deleted`);
            }
            if (error.response.status === CONFLICT) {
              return toast.error(
                `You cannot perform delete on this ${routeName}`
              );
            }
          }
        }
        toast.error(`Something went wrong while deleting ${routeName}`);
      } finally {
        onError?.(error);
      }
    },

    onSettled: () => {
      onSettled?.();
    },
  });

  return { isLoading, mutate };
};
