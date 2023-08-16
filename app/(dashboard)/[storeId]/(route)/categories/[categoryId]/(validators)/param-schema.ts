import {
  categoryIdParamSchema,
  storeIdParamSchema,
} from '@/app/api/(params)/params-schema';
import { TypeOf } from 'zod';

const singleCategoryParamSchema = storeIdParamSchema.and(categoryIdParamSchema);
type SingleCategoryParam = TypeOf<typeof singleCategoryParamSchema>;

export { singleCategoryParamSchema };
export type { SingleCategoryParam };
