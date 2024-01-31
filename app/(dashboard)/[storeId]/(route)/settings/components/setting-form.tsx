'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Stores } from '@/schema/store';
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
import axios, { AxiosError } from 'axios';
import { BAD_REQUEST, CONFLICT, NOT_FOUND, UNAUTHORIZED } from 'http-status';
import toast from 'react-hot-toast';
import { redirect, useParams, useRouter } from 'next/navigation';
import { DashboardLayoutParams } from '../../../layout';
import {
  SettingsFormValues,
  settingsFormSchema,
} from '@/validators/setting-form';
import { AlertModal } from '@/components/models/alert-modal';
import { ApiAlert } from '@/components/ui/api-alert';
import { useOrigin } from '@/hooks/use-origin';

interface SettingsFormProps {
  store: Stores;
}

export const SettingsForm: React.FC<SettingsFormProps> = ({ store }) => {
  const settingForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: { name: store.name },
  });

  const { storeId } = useParams() as DashboardLayoutParams;
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const router = useRouter();
  const origin = useOrigin();

  if (store.id !== storeId) {
    router.refresh();
    return null;
  }

  const { mutate: updateStoreSettings, isLoading: storeUpdateProcessing } =
    useMutation({
      mutationFn: async (data: SettingsFormValues) => {
        const response = await axios.patch<Stores>(
          `/api/stores/${storeId}`,
          data
        );
        return response.data;
      },

      onSuccess: () => {
        router.refresh();
        toast.success('Store details updated');
      },
      onError: (error) => {
        if (error instanceof AxiosError) {
          if (
            error.response?.status === CONFLICT ||
            error.response?.status === NOT_FOUND
          ) {
            return toast.error(error.response.data);
          } else if (error.response?.status === UNAUTHORIZED) {
            setTimeout(() => {
              redirect('/sign-in');
            }, 2000);
            return toast.error('Kindly log in again');
          }
        }

        toast.error('Something went wrong while update store details');
      },
    });

  const { mutate: deleteStore, isLoading: storeDeleting } = useMutation({
    mutationFn: () => axios.delete(`/api/stores/${storeId}`),
    onSuccess: () => {
      toast.success('Store deleted');
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 50);
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === BAD_REQUEST) {
          return toast.error(error.response.data);
        } else if (error.response?.status === UNAUTHORIZED) {
          setTimeout(() => {
            redirect('/sign-in');
          }, 2000);
          return toast.error('Kindly log in again');
        }
      }

      toast.error('Something went wrong while removing store');
    },

    onSettled: () => {
      setDeleteAlertOpen(true);
    },
  });

  return (
    <>
      <AlertModal
        loading={storeDeleting}
        modalOpen={deleteAlertOpen}
        onClose={() => setDeleteAlertOpen(false)}
        onConfirm={() => deleteStore()}
      />
      <div className="flex items-center justify-between">
        <Heading title="Settings" description="Manage store preference" />
        <Button
          disabled={storeUpdateProcessing}
          variant="destructive"
          size="sm"
          onClick={() => setDeleteAlertOpen(true)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
      <Separator />
      <Form {...settingForm}>
        <form
          onSubmit={settingForm.handleSubmit((data) =>
            updateStoreSettings(data)
          )}
          className="space-y-8 w-full"
        >
          <div className="grid grid-cols-3 gap-8">
            <FormField
              control={settingForm.control}
              name="name"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        disabled={storeUpdateProcessing}
                        placeholder="Store name"
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
            disabled={storeUpdateProcessing}
            className="ml-auto"
            type="submit"
          >
            Save changes
          </Button>
        </form>
      </Form>
      <Separator />
      <ApiAlert
        title="NEXT_PUBLIC_API_URL"
        description={`${origin ?? ''}/api/stores/${storeId}`}
      />
    </>
  );
};
