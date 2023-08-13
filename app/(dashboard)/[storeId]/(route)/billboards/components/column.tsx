import { ColumnDef } from '@tanstack/react-table';

export type BillBoardColumns = {
  id: string;
  label: string;
  createdAt: string;
};

export const billboardColumns: ColumnDef<BillBoardColumns>[] = [
  { accessorKey: 'label', header: 'Label' },
  { accessorKey: 'createdAt', header: 'Date' },
];
