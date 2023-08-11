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
import { useParams, useRouter } from 'next/navigation';

import { AlertModal } from '@/components/models/alert-modal';
import { ApiAlert } from '@/components/ui/api-alert';
import { useOrigin } from '@/hooks/use-origin';
import { BillBoardParams } from '../type';
import { BillBoard } from '@/schema/bill-board';
import {
  BillBoardFormPayload,
  billBoardFormSchema,
} from '../(validators)/bill-form-schema';
import { ImageUpload } from '@/components/ui/image-upload';
import { DashboardLayoutParams } from '@/app/(dashboard)/[storeId]/layout';

interface BillBoardFormProps {
  initialBillBoard: BillBoard | null;
}

export const BillBoardForm: React.FC<BillBoardFormProps> = ({
  initialBillBoard,
}) => {
  const { billboardId, storeId } = useParams() as BillBoardParams &
    DashboardLayoutParams;
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const router = useRouter();
  const origin = useOrigin();

  const billBoardForm = useForm<BillBoardFormPayload>({
    resolver: zodResolver(billBoardFormSchema),
    defaultValues: initialBillBoard ?? { label: '', imageUrl: '' },
  });

  const {
    mutateAsync: serverSyncBillboard,
    isLoading: billBoardActionProcessing,
  } = useMutation<void>({
    mutationFn: async () => {
      let response: AxiosResponse;
      if (initialBillBoard) {
        response = await axios.patch(
          `api/${storeId}/billboards/${billboardId}`
        );
      } else {
        response = await axios.post(`api/${storeId}/billboards/`);
      }
      return response.data;
    },
  });

  const { mutateAsync: removeBillboard, isLoading: billboardDeleting } =
    useMutation<void>({
      mutationFn: async () =>
        await axios.delete(`api/${storeId}/billboards/${billboardId}`),
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
        loading={actionOnBillboardLoading}
        modalOpen={deleteAlertOpen}
        onClose={() => setDeleteAlertOpen(false)}
        onConfirm={() => serverSyncBillboard()}
      />
      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        {initialBillBoard ? (
          <Button
            disabled={actionOnBillboardLoading}
            variant="destructive"
            size="sm"
            onClick={() => setDeleteAlertOpen(true)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      <Separator />
      <Form {...billBoardForm}>
        <form
          onSubmit={billBoardForm.handleSubmit(
            (data) => {}
            // updateStoreSettings(data)
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
      <Separator />
      <ApiAlert
        title="NEXT_PUBLIC_API_URL"
        description={`${origin ?? ''}/api/${billboardId}`}
      />
    </>
  );
};
