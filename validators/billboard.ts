import { billBoardFormSchema } from '@/app/(dashboard)/[storeId]/(route)/billboards/[billboardId]/(validators)/bill-form-schema';
import { storeIdParamSchema } from '@/app/api/(params)/params-schema';
import { object } from 'zod';

export const createBillboardSchema = object({
  params: storeIdParamSchema,
  body: billBoardFormSchema,
});
