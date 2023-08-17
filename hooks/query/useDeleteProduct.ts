import { Products } from '@/schema/product';
import { UseDeleteItemProps, useDeleteItem } from './useItemDelete';

interface UseDeleteProductProps
  extends Pick<
    UseDeleteItemProps,
    'storeId' | 'onError' | 'onSettled' | 'onSuccess'
  > {
  productId: Products['id'];
}

export const useDeleteProduct = (props: UseDeleteProductProps) => {
  const { isLoading, mutate } = useDeleteItem({
    ...props,
    itemPathName: props.productId,
    routeName: 'products',
  });

  return { deletingProduct: isLoading, deleteProduct: mutate };
};
