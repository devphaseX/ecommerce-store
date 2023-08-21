import {
  categoryIdParamSchema,
  createDynamicPathSchema,
  storeIdParamSchema,
} from '@/app/api/(params)/params-schema';
import { TypeOf } from 'zod';

const categoryPageParamsValidator = storeIdParamSchema.and(
  createDynamicPathSchema(categoryIdParamSchema)
);
type CategoryPageParams = TypeOf<typeof categoryPageParamsValidator>;

export { categoryPageParamsValidator };
export type { CategoryPageParams };
