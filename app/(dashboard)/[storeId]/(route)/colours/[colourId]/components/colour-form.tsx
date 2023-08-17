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
  colourFormSchema,
  ColourFormSchema,
} from '../(validators)/colour-form-schema';
import { NOT_FOUND, UNAUTHORIZED, UNPROCESSABLE_ENTITY } from 'http-status';
import { AlertModal } from '@/components/models/alert-modal';
import {
  ParamWithColourId,
  ParamWithStoreId,
} from '@/app/api/(params)/params-schema';
import { useDeleteColour } from '@/hooks/query/useDeleteColour';
import { Colours } from '@/schema/colour';

interface ColourProps {
  toUpdateColour: Colours | null;
}

export const ColourForm: React.FC<ColourProps> = ({ toUpdateColour }) => {
  const { colourId, storeId } = useParams() as ParamWithColourId &
    ParamWithStoreId;
  const [deletePromptModalOpen, setDeletePromptModalOpen] = useState(false);

  const { onDeleteColour, colourDeleting } = useDeleteColour({
    colourId,
    storeId,
    onSuccess: () => setDeletePromptModalOpen(false),
    onSettled: () => router.refresh(),
  });

  const router = useRouter();

  const colourForm = useForm<ColourFormSchema>({
    resolver: zodResolver(colourFormSchema),
    defaultValues: toUpdateColour ?? { name: '', value: '' },
  });

  const {
    mutateAsync: serverSyncBillboard,
    isLoading: billBoardActionProcessing,
  } = useMutation({
    mutationFn: async (data: ColourFormSchema) => {
      let response: AxiosResponse<Colours>;

      if (toUpdateColour) {
        response = await axios.patch<Colours>(
          `/api/${storeId}/colours/${colourId}`,
          data
        );
      } else {
        response = await axios.post<Colours>(`/api/${storeId}/colours/`, data);
      }
      return response.data;
    },

    onSuccess: () => {
      toast.success(toastMessage);
      setTimeout(() => {
        router.push(`/${storeId}/colours`);
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
          toUpdateColour ? 'updating' : 'creating'
        } colour`
      );
    },
  });

  const actionColourLoading = billBoardActionProcessing || colourDeleting;

  const title = toUpdateColour ? 'Edit Colour' : 'Create Colour';
  const description = toUpdateColour ? 'Edit a Colour' : 'Add a new Colour';
  const toastMessage = toUpdateColour ? 'Colour Updated' : 'Colour created';
  const action = toUpdateColour ? 'Save changes' : 'Create';
  return (
    <>
      <AlertModal
        modalOpen={deletePromptModalOpen}
        loading={actionColourLoading}
        onClose={() => setDeletePromptModalOpen(false)}
        onConfirm={() => onDeleteColour()}
      />
      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        {toUpdateColour ? (
          <Button
            disabled={actionColourLoading}
            variant="destructive"
            size="sm"
            onClick={() => setDeletePromptModalOpen(true)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      <Separator />
      <Form {...colourForm}>
        <form
          onSubmit={colourForm.handleSubmit((data) =>
            serverSyncBillboard(data)
          )}
          className="space-y-8 w-full"
        >
          <div className="grid grid-cols-3 gap-8">
            <FormField
              control={colourForm.control}
              name="name"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        disabled={actionColourLoading}
                        placeholder="Colour name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={colourForm.control}
              name="value"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-4">
                        <Input
                          disabled={actionColourLoading}
                          placeholder="Colour value"
                          {...field}
                        />
                        <div
                          className="border p-4 rounded-full"
                          style={{ backgroundColor: field.value }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
          <Button
            disabled={actionColourLoading}
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
