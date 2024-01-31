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
  FormDescription,
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
import { NOT_FOUND, UNAUTHORIZED, UNPROCESSABLE_ENTITY } from 'http-status';
import { AlertModal } from '@/components/models/alert-modal';
import {
  ParamWithProductId,
  ParamWithStoreId,
} from '@/app/api/(params)/params-schema';
import { useDeleteProduct } from '@/hooks/query/useDeleteProduct';
import { CreateProduct, Products, createProductSchema } from '@/schema/product';
import { ImageUpload } from '@/components/ui/image-upload';
import { Category } from '@/schema/category';
import { Sizes } from '@/schema/size';
import { Colours } from '@/schema/colour';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface ProductProps {
  toUpdateProduct:
    | (Omit<CreateProduct, 'price'> & {
        price: string;
        category: Category;
        size: Sizes;
        colour: Colours;
      })
    | null;
  categories: Array<Category>;
  sizes: Array<Sizes>;
  colours: Array<Colours>;
}

export const ProductForm: React.FC<ProductProps> = ({
  toUpdateProduct,
  categories,
  sizes,
  colours,
}) => {
  const { productId, storeId } = useParams() as ParamWithProductId &
    ParamWithStoreId;
  const [deletePromptModalOpen, setDeletePromptModalOpen] = useState(false);

  const { deleteProduct, deletingProduct } = useDeleteProduct({
    productId,
    storeId,
    onSuccess: () => setDeletePromptModalOpen(false),
    onSettled: () => router.refresh(),
  });

  const router = useRouter();

  const productForm = useForm<NonNullable<typeof toUpdateProduct>>({
    resolver: zodResolver(createProductSchema),
    defaultValues: toUpdateProduct ?? {
      name: '',
      price: '0',
      images: [],
      isArchieved: false,
      isFeatured: false,
      sizeId: '',
      colourId: '',
      categoryId: '',
    },
  });

  const {
    mutateAsync: serverSyncBillboard,
    isLoading: billBoardActionProcessing,
  } = useMutation({
    mutationFn: async (data: CreateProduct) => {
      let response: AxiosResponse<Products>;
      if (toUpdateProduct) {
        response = await axios.patch<Products>(
          `/api/stores/${storeId}/products/${productId}`,
          data
        );
      } else {
        response = await axios.post<Products>(
          `/api/stores/${storeId}/products/`,
          data
        );
      }
      return response.data;
    },

    onSuccess: () => {
      toast.success(toastMessage);
      setTimeout(() => {
        router.push(`/${storeId}/products`);
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
          toUpdateProduct ? 'updating' : 'creating'
        } product`
      );
    },
  });

  const actionProductLoading = billBoardActionProcessing || deletingProduct;

  const title = toUpdateProduct ? 'Edit Product' : 'Create Product';
  const description = toUpdateProduct ? 'Edit a Product' : 'Add a new Product';
  const toastMessage = toUpdateProduct ? 'Product Updated' : 'Product created';
  const action = toUpdateProduct ? 'Save changes' : 'Create';
  return (
    <>
      <AlertModal
        modalOpen={deletePromptModalOpen}
        loading={actionProductLoading}
        onClose={() => setDeletePromptModalOpen(false)}
        onConfirm={() => deleteProduct()}
      />
      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        {toUpdateProduct ? (
          <Button
            disabled={actionProductLoading}
            variant="destructive"
            size="sm"
            onClick={() => setDeletePromptModalOpen(true)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      <Separator />
      <Form {...productForm}>
        <form
          onSubmit={productForm.handleSubmit((data) =>
            serverSyncBillboard(data)
          )}
          className="space-y-8 w-full"
        >
          <FormField
            control={productForm.control}
            name="images"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Images</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value.map(({ url }) => url)}
                      disable={actionProductLoading}
                      onChange={(url) =>
                        field.onChange([...field.value, { url }])
                      }
                      onRemove={(url) =>
                        field.onChange(
                          field.value.filter((current) => current.url !== url)
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <div className="grid grid-cols-3 gap-8">
            <FormField
              control={productForm.control}
              name="name"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        disabled={actionProductLoading}
                        placeholder="Product name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={productForm.control}
              name="price"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        disabled={actionProductLoading}
                        placeholder="9.99"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={productForm.control}
              name="categoryId"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      disabled={actionProductLoading}
                      onValueChange={field.onChange}
                      value={
                        field.value ||
                        toUpdateProduct?.category.name ||
                        undefined
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        {categories?.map(({ name, id }) => (
                          <SelectItem key={id} value={id}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={productForm.control}
              name="sizeId"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Size</FormLabel>
                    <Select
                      disabled={actionProductLoading}
                      onValueChange={field.onChange}
                      value={
                        field.value || toUpdateProduct?.size.name || undefined
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a size" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        {sizes.map(({ name, id }) => (
                          <SelectItem key={id} value={id}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={productForm.control}
              name="colourId"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Colour</FormLabel>
                    <Select
                      disabled={actionProductLoading}
                      onValueChange={field.onChange}
                      value={
                        field.value || toUpdateProduct?.colour.id || undefined
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a colour" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        {colours.map(({ name, id }) => (
                          <SelectItem key={id} value={id}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={productForm.control}
              name="isFeatured"
              render={({ field }) => {
                return (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Featured</FormLabel>
                      <FormDescription>
                        This product will appear on the home page
                      </FormDescription>
                    </div>
                  </FormItem>
                );
              }}
            />
            <FormField
              control={productForm.control}
              name="isArchieved"
              render={({ field }) => {
                return (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Archieved</FormLabel>
                      <FormDescription>
                        This product will not appear any where in the store
                      </FormDescription>
                    </div>
                  </FormItem>
                );
              }}
            />
          </div>
          <Button
            disabled={actionProductLoading}
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
