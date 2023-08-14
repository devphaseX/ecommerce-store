import { UseMutationOptions } from '@tanstack/react-query';

export type MutationActions = {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  onSettled?: () => void;
};
