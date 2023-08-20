import { ColumnDef } from '@tanstack/react-table';
import { Order } from '@/schema/order';

export type OrderColumns = {
  id: string;
  madePayments: boolean;
  address: string | null;
  phoneNo: string | null;
  storeId: string;
  totalPrice: number;
  productNames: string;
  createdAt: string;
  updatedAt: string;
};

export const orderColumns: ColumnDef<OrderColumns>[] = [
  { accessorKey: 'productsName', header: 'Products' },
  { accessorKey: 'phoneNo', header: 'Phone' },
  { accessorKey: 'address', header: 'Address' },
  { accessorKey: 'totalPrice', header: 'Total price' },
  { accessorKey: 'madePayment', header: 'Paid' },
  { accessorKey: 'size', header: 'Size' },
  { accessorKey: 'createdAt', header: 'Date' },
];
