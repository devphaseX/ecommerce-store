import { storeIdParamSchema } from '@/app/api/(params)/params-schema';
import { object, TypeOf, string } from 'zod';
import { Sizes } from '@/schema/size';
import { BillBoard } from '@/schema/bill-board';

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

const sizeFormSchema = object({
  name: string({
    required_error: 'name is required',
    invalid_type_error: 'name should be a text',
  }).nonempty(),
  value: string({
    required_error: 'value is required',
    invalid_type_error: 'value should be a text',
  }).nonempty(),
} satisfies Record<keyof Omit<Sizes, 'id' | 'createdAt' | 'updatedAt' | 'storeId'>, unknown>);

type SizeFormPayload = TypeOf<typeof sizeFormSchema>;

const billBoardFormSchema = object({
  label: string({
    required_error: 'Label is required',
    invalid_type_error: 'Label should be a text',
  }).nonempty(),
  imageUrl: string({
    required_error: 'imageUrl is required',
    invalid_type_error: 'ImageUrl should be a url',
  }).url(),
} satisfies Record<keyof Omit<BillBoard, 'id' | 'createdAt' | 'updatedAt' | 'storeId'>, unknown>);

type BillBoardFormPayload = TypeOf<typeof billBoardFormSchema>;

export {
  billBoardFormSchema,
  type BillBoardFormPayload,
  sizeFormSchema,
  type SizeFormPayload,
};
