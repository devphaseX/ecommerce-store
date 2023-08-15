import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { Category } from '@/schema/category';

export type CategoryColumns = Pick<Category, 'id' | 'name'> & {
  billboardLabel: string;
  createdAt: string;
};

export const categoryColumns: ColumnDef<CategoryColumns>[] = [
  { accessorKey: 'name', header: 'Label' },
  {
    accessorKey: 'billboardLabel',
    header: 'Billboard',
    cell: ({ row }) => row.original.billboardLabel,
  },
  { accessorKey: 'createdAt', header: 'Date' },

  { id: 'actions', cell: ({ row }) => <CellAction data={row.original} /> },
];
