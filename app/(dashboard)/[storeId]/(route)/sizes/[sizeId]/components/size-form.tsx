'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { useMutation } from '@tanstack/react-query';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import axios, { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { redirect, useParams, useRouter } from 'next/navigation';

import {
  SizeFormPayload,
  sizeFormSchema,
} from '../(validators)/size-form-schema';
import { NOT_FOUND, UNAUTHORIZED, UNPROCESSABLE_ENTITY } from 'http-status';
import { AlertModal } from '@/components/models/alert-modal';
import { Sizes } from '@/schema/size';
import {
  ParamWithSizeId,
  ParamWithStoreId,
} from '@/app/api/(params)/params-schema';
import { useDeleteSize } from '@/hooks/query/useDeleteSize';

interface SizeProps {
  toUpdateSize: Sizes | null;
}

export const SizeForm: React.FC<SizeProps> = ({ toUpdateSize }) => {
  const { storeId, sizeId } = useParams() as ParamWithSizeId & ParamWithStoreId;
  const [deletePromptModalOpen, setDeletePromptModalOpen] = useState(false);

  const { onDeleteSize, sizeDeleting } = useDeleteSize({
    sizeId,
    storeId,
    onSuccess: () => setDeletePromptModalOpen(false),
    onSettled: () => {
      router.refresh();
      router.push(`/${storeId}/sizes`);
    },
  });

  const router = useRouter();

  const billBoardForm = useForm<SizeFormPayload>({
    resolver: zodResolver(sizeFormSchema),
    defaultValues: toUpdateSize ?? { name: '', value: '' },
  });

  const {
    mutateAsync: serverSyncBillboard,
    isLoading: billBoardActionProcessing,
  } = useMutation({
    mutationFn: async (data: SizeFormPayload) => {
      let response: AxiosResponse<Sizes>;

      if (toUpdateSize) {
        response = await axios.patch<Sizes>(
          `/api/${storeId}/sizes/${sizeId}`,
          data
        );
      } else {
        response = await axios.post<Sizes>(`/api/${storeId}/sizes/`, data);
      }
      return response.data;
    },

    onSuccess: () => {
      toast.success(toastMessage);
      setTimeout(() => {
        router.push(`/${storeId}/sizes`);
        router.refresh();
      });
    },

    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response) {
          if (
            error.response.status === NOT_FOUND &&
            String(error.response.data).match(/store/i)
          ) {
            toast.error('Store not exist');
            return setTimeout(() => router.push('/'), 3000);
          } else if (error.response.status === UNAUTHORIZED) {
            toast.error('Ensure you are signed in');
            return redirect('/sign-in');
          } else if (error.response.status === UNPROCESSABLE_ENTITY) {
            return toast.error(
              'Check your form feed, You have provided an incorrect information form'
            );
          }
        }
      }

      toast.error(
        `Something went wrong while ${
          toUpdateSize ? 'updating' : 'creating'
        } Size`
      );
    },
  });

  const actionOnBillboardLoading = billBoardActionProcessing || sizeDeleting;

  const title = toUpdateSize ? 'Edit Size' : 'Create Size';
  const description = toUpdateSize ? 'Edit a Size' : 'Add a new Size';
  const toastMessage = toUpdateSize ? 'Size Updated' : 'Size created';
  const action = toUpdateSize ? 'Save changes' : 'Create';
  return (
    <>
      <AlertModal
        modalOpen={deletePromptModalOpen}
        loading={actionOnBillboardLoading}
        onClose={() => setDeletePromptModalOpen(false)}
        onConfirm={() => onDeleteSize()}
      />
      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        {toUpdateSize ? (
          <Button
            disabled={actionOnBillboardLoading}
            variant="destructive"
            size="sm"
            onClick={() => setDeletePromptModalOpen(true)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      <Separator />
      <Form {...billBoardForm}>
        <form
          onSubmit={billBoardForm.handleSubmit((data) =>
            serverSyncBillboard(data)
          )}
          className="space-y-8 w-full"
        >
          <div className="grid grid-cols-3 gap-8">
            <FormField
              control={billBoardForm.control}
              name="name"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Input
                        disabled={actionOnBillboardLoading}
                        placeholder="Size name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={billBoardForm.control}
              name="value"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input
                        disabled={actionOnBillboardLoading}
                        placeholder="Size value"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
          <Button
            disabled={actionOnBillboardLoading}
            className="ml-auto"
            type="submit"
          >
            {action}
          </Button>
        </form>
      </Form>
    </>
  );
};
