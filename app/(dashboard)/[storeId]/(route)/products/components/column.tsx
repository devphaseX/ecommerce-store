import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { ResponseProduct } from '@/schema/product';

export type ProductColumns = Pick<
  ResponseProduct,
  | 'id'
  | 'name'
  | 'price'
  | 'category'
  | 'colour'
  | 'size'
  | 'isArchieved'
  | 'isFeatured'
  | 'createdAt'
>;

export const productColumns: ColumnDef<ProductColumns>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'isArchieved', header: 'Archieved' },
  { accessorKey: 'isFeatured', header: 'Featured' },
  { accessorKey: 'price', header: 'Price' },
  { accessorKey: 'category', header: 'Category' },
  { accessorKey: 'size', header: 'Size' },
  {
    accessorKey: 'colour',
    header: 'Colour',
    cell: ({ row }) => (
      <div className="flex items-center gap-x-2">
        {row.original.colour}
        <div
          className="h-6 w-6 rounded-full border"
          style={{ backgroundColor: row.original.colour }}
        ></div>
      </div>
    ),
  },

  { accessorKey: 'createdAt', header: 'Date' },
  { id: 'actions', cell: ({ row }) => <CellAction data={row.original} /> },
];
