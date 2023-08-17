import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { CONFLICT, NOT_FOUND } from 'http-status';
import toast from 'react-hot-toast';
import { MutationActions } from './type';
import {
  ParamWithColourId,
  ParamWithStoreId,
} from '@/app/api/(params)/params-schema';

interface useDeleteColourProps
  extends MutationActions,
    ParamWithColourId,
    ParamWithStoreId {}

export const useDeleteColour = ({
  storeId,
  colourId,
  onSuccess,
  onError,
  onSettled,
}: useDeleteColourProps) => {
  const { mutate: onDeleteColour, isLoading: colourDeleting } = useMutation({
    mutationFn: () => axios.delete(`/api/${storeId}/colours/${colourId}`),
    onSuccess: () => {
      toast.success('Colour delete successfully');
      onSuccess?.();
    },
    onError: (error) => {
      try {
        if (error instanceof AxiosError) {
          if (error.response) {
            if (error.response.status === NOT_FOUND) {
              return toast.error('Colour already deleted');
            }
            if (error.response.status === CONFLICT) {
              return toast.error('You cannot perform delete on this colour');
            }
          }
        }
        toast.error('Something went wrong while deleting colour');
      } finally {
        onError?.(error);
      }
    },

    onSettled: () => {
      onSettled?.();
    },
  });

  return { onDeleteColour, colourDeleting };
};
