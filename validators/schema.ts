import { storeIdParamSchema } from '@/app/api/(params)/params-schema';
import { object } from 'zod';
import {
  createProductSchema,
  requestColourCreateSchema,
  requestSizeCreateSchema,
} from '../schema';
import { categoryFormSchema } from '@/app/(dashboard)/[storeId]/(route)/categories/[categoryId]/(validators)/category-form-schema';

export const createSizeSchema = object({
  params: storeIdParamSchema,
  body: requestSizeCreateSchema,
});

export const createProductRouteSchema = object({
  params: storeIdParamSchema,
  body: createProductSchema,
});

export const createColourSchema = object({
  params: storeIdParamSchema,
  body: requestColourCreateSchema,
});

export const createBillboardSchema = object({
  params: storeIdParamSchema,
  body: categoryFormSchema,
});
