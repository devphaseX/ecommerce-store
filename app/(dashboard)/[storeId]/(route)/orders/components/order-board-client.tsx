'use client';

import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { OrderColumns, orderColumns } from './column';
import { DataTable } from '@/components/ui/data-table';

interface OrderClientProps {
  data: Array<OrderColumns>;
}

export const OrderClient: React.FC<OrderClientProps> = ({ data }) => {
  return (
    <>
      <Heading
        title={`Orders (${data.length})`}
        description="Manage orders for your store"
      />
      <Separator />
      <DataTable searchKey="productsName" columns={orderColumns} data={data} />
    </>
  );
};
