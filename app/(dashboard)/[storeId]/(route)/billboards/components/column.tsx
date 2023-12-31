import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

export type BillBoardColumns = {
  id: string;
  label: string;
  createdAt: string;
};

export const billboardColumns: ColumnDef<BillBoardColumns>[] = [
  { accessorKey: 'label', header: 'Label' },
  { accessorKey: 'createdAt', header: 'Date' },
  { id: 'actions', cell: ({ row }) => <CellAction data={row.original} /> },
];
