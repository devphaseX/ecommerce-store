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
import { redirect, useParams, usePathname, useRouter } from 'next/navigation';

import { BillBoard } from '@/schema/bill-board';
import {
  CategoryFormPayload,
  categoryFormSchema,
} from '../(validators)/category-form-schema';
import {
  CONFLICT,
  NOT_FOUND,
  UNAUTHORIZED,
  UNPROCESSABLE_ENTITY,
} from 'http-status';
import { AlertModal } from '@/components/models/alert-modal';
import {
  ParamWithCategoryId,
  ParamWithStoreId,
} from '@/app/api/(params)/params-schema';
import { useDeleteCategory } from '@/hooks/query/useDeleteCategory';
import { Category } from '@/schema/category';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CategoryFormProps {
  initialCategory: Category | null;
  activeBillboards: Array<BillBoard>;
}

interface ActiveCatagoryContextParam
  extends ParamWithCategoryId,
    ParamWithStoreId {}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  initialCategory,
  activeBillboards,
}) => {
  const { categoryId, storeId } = useParams() as ActiveCatagoryContextParam;
  const [deletePromptModalOpen, setDeletePromptModalOpen] = useState(false);
  const pathname = usePathname();
  const { categoryDeleteActionInProgress, deleteCategoryAction } =
    useDeleteCategory({
      storeId,
      categoryId: initialCategory?.id,
      categoryName: initialCategory?.name,
      onSuccess: () =>
        router.push(pathname.replace(/(\/categories)\/?.*/, '$1')),
    });

  const router = useRouter();

  const categoryForm = useForm<CategoryFormPayload>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: (initialCategory as CategoryFormPayload) ?? {
      name: '',
      billboardId: '',
    },
  });

  const {
    mutateAsync: categoryMutateAction,
    isLoading: categoryActionProcessing,
  } = useMutation({
    mutationFn: async (data: CategoryFormPayload) => {
      let response: AxiosResponse<Category>;

      if (initialCategory) {
        response = await axios.patch<Category>(
          `/api/${storeId}/categories/${categoryId}`,
          data
        );
      } else {
        response = await axios.post<Category>(
          `/api/${storeId}/categories/`,
          data
        );
      }
      return response.data;
    },

    onSuccess: () => {
      toast.success(toastMessage);
      setTimeout(() => {
        router.push(`/${storeId}/categories`);
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
          } else if (error.response.status === CONFLICT) {
            return toast.error(error.response.data);
          }
        }
      }

      toast.error(
        `Something went wrong while ${
          initialCategory ? 'updating' : 'creating'
        } category`
      );
    },
  });

  const categoryActionInProgress =
    categoryActionProcessing || categoryActionProcessing;

  const title = initialCategory ? 'Edit Category' : 'Create Category';
  const description = initialCategory
    ? 'Edit a category'
    : 'Add a new category';
  const toastMessage = initialCategory
    ? 'Category Updated'
    : 'Category created';
  const action = initialCategory ? 'Save changes' : 'Create';
  return (
    <>
      <AlertModal
        modalOpen={deletePromptModalOpen}
        loading={categoryDeleteActionInProgress}
        onClose={() => setDeletePromptModalOpen(false)}
        onConfirm={() => deleteCategoryAction()}
      />
      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        {initialCategory ? (
          <Button
            disabled={categoryActionInProgress}
            variant="destructive"
            size="sm"
            onClick={() => setDeletePromptModalOpen(true)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      <Separator />
      <Form {...categoryForm}>
        <form
          onSubmit={categoryForm.handleSubmit((data) =>
            categoryMutateAction(data)
          )}
          className="space-y-8 w-full"
        >
          <div className="grid grid-cols-3 gap-8">
            <FormField
              control={categoryForm.control}
              name="name"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Input
                        disabled={categoryActionInProgress}
                        placeholder="Category name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={categoryForm.control}
              name="billboardId"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Billboard</FormLabel>
                    <Select
                      disabled={categoryActionInProgress}
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a billboard" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        {activeBillboards.map(({ id, label }) => (
                          <SelectItem key={id} value={id}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
          <Button
            disabled={categoryActionInProgress}
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
