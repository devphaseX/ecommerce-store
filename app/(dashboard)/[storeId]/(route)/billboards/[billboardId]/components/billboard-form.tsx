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

import { BillBoardParams } from '../type';
import { BillBoard } from '@/schema/bill-board';
import {
  BillBoardFormPayload,
  billBoardFormSchema,
} from '../(validators)/bill-form-schema';
import { ImageUpload } from '@/components/ui/image-upload';
import { DashboardLayoutParams } from '@/app/(dashboard)/[storeId]/layout';
import { NOT_FOUND, UNAUTHORIZED, UNPROCESSABLE_ENTITY } from 'http-status';
import { useDeleteBillboard } from '@/hooks/query/useDeleteBillboard';
import { AlertModal } from '@/components/models/alert-modal';

interface BillBoardFormProps {
  initialBillBoard: BillBoard | null;
}

export const BillBoardForm: React.FC<BillBoardFormProps> = ({
  initialBillBoard,
}) => {
  const { billboardId, storeId } = useParams() as BillBoardParams &
    DashboardLayoutParams;
  const [deletePromptModalOpen, setDeletePromptModalOpen] = useState(false);

  const { billboardDeleting, onDeleteBillboard } = useDeleteBillboard({
    billboardId,
    storeId,
    onSuccess: () => setDeletePromptModalOpen(false),
    onSettled: () => {
      router.refresh();
      router.push(`/${storeId}/billboards`);
    },
  });

  const router = useRouter();

  const billBoardForm = useForm<BillBoardFormPayload>({
    resolver: zodResolver(billBoardFormSchema),
    defaultValues: initialBillBoard ?? { label: '', imageUrl: '' },
  });

  const {
    mutateAsync: serverSyncBillboard,
    isLoading: billBoardActionProcessing,
  } = useMutation({
    mutationFn: async (data: BillBoardFormPayload) => {
      let response: AxiosResponse<BillBoard>;

      if (initialBillBoard) {
        response = await axios.patch<BillBoard>(
          `/api/${storeId}/billboards/${billboardId}`,
          data
        );
      } else {
        response = await axios.post<BillBoard>(
          `/api/${storeId}/billboards/`,
          data
        );
      }
      return response.data;
    },

    onSuccess: () => {
      toast.success(toastMessage);
      setTimeout(() => {
        router.push(`/${storeId}/billboards`);
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
          initialBillBoard ? 'updating' : 'creating'
        } billboard`
      );
    },
  });

  const actionOnBillboardLoading =
    billBoardActionProcessing || billboardDeleting;

  const title = initialBillBoard ? 'Edit billboard' : 'Create billboard';
  const description = initialBillBoard
    ? 'Edit a billboard'
    : 'Add a new billboard';
  const toastMessage = initialBillBoard
    ? 'Billboard Updated'
    : 'Billboard created';
  const action = initialBillBoard ? 'Save changes' : 'Create';
  return (
    <>
      <AlertModal
        modalOpen={deletePromptModalOpen}
        loading={actionOnBillboardLoading}
        onClose={() => setDeletePromptModalOpen(false)}
        onConfirm={() => onDeleteBillboard()}
      />
      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        {initialBillBoard ? (
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
          <FormField
            control={billBoardForm.control}
            name="imageUrl"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Background Image</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value ? [field.value] : []}
                      disable={actionOnBillboardLoading}
                      onChange={(imgUrl) => field.onChange(imgUrl)}
                      onRemove={() => field.onChange('')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <div className="grid grid-cols-3 gap-8">
            <FormField
              control={billBoardForm.control}
              name="label"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Input
                        disabled={actionOnBillboardLoading}
                        placeholder="Billboard label"
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
