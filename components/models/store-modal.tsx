'use client';
import { Modal } from '@/ui/modal';
import { useStoreModal } from '@/hooks/use-store-modal';
import { TypeOf, object, string } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/form';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { Stores } from '@/schema/store';
import {
  CreateStoreFormPayload,
  createStoreFormSchema,
} from '../../validators/create-store';
import { useIsClient } from 'usehooks-ts';

export const StoreModal = () => {
  const { isOpen, onClose, onOpen } = useStoreModal();
  const form = useForm<CreateStoreFormPayload>({
    resolver: zodResolver(createStoreFormSchema),
    defaultValues: {
      name: '',
    },
  });

  const isClientSide = useIsClient();

  const { isLoading, mutate: createStore } = useMutation({
    mutationFn: async (data: CreateStoreFormPayload) => {
      const response = await axios.post<Stores>('/api/stores', data);
      return response.data;
    },

    onSuccess: ({ id: storeId }) => {
      if (!isClientSide) return;
      window.location.assign(`/${storeId}`);
    },

    onError: (error) => {
      if (!isClientSide) return;

      if (error instanceof AxiosError && error.response?.status) {
        return toast.error(error.response.data);
      }

      toast.error('Something went wrong while creating store');
    },
  });

  const onSubmit = form.handleSubmit(async (formValues) => {
    createStore(formValues);
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create store "
      description="Add a new store to manage products and categories"
    >
      <div>
        <div className="space-y-4 py-2 pb-4">
          <Form {...form}>
            <form onSubmit={onSubmit}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="E-commerce"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="pt-6 space-x-2 flex items-center justify-end w-full">
                <Button disabled={isLoading} variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button disabled={isLoading} type="submit">
                  Continue
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </Modal>
  );
};
