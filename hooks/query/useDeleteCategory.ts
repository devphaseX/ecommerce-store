import { useMutation } from '@tanstack/react-query';
import { MutationActions } from './type';
import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { CONFLICT, NOT_FOUND } from 'http-status';

interface UseDeleteCategoryOption extends MutationActions {
  storeId: string;
  categoryId?: string;
  categoryName?: string;
}

export const useDeleteCategory = (option: UseDeleteCategoryOption) => {
  const { storeId, categoryId, categoryName, onError, onSettled, onSuccess } =
    option;
  const {
    isLoading: categoryDeleteActionInProgress,
    mutate: deleteCategoryAction,
  } = useMutation({
    mutationFn: async () => {
      if (storeId && categoryId) {
        return axios.delete(`/api/stores/${storeId}/categories/${categoryId}`);
      }
    },
    onSuccess: () => {
      toast.success(`Category {${categoryName}} delete succesfully`);
      onSuccess?.();
    },

    onError: (error) => {
      try {
        if (error instanceof AxiosError) {
          if (error.response) {
            if (error.response.status === NOT_FOUND) {
              return toast.error('Category already deleted');
            }
            if (error.response.status === CONFLICT) {
              return toast.error('You cannot perform delete on this category');
            }
          }
        }
        toast.error('Something went wrong while deleting category');
      } finally {
        onError?.(error);
      }
    },

    onSettled: () => {
      onSettled?.();
    },
  });

  return { categoryDeleteActionInProgress, deleteCategoryAction };
};
