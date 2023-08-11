import { uuid } from 'drizzle-orm/pg-core';
import { TypeOf, object, string } from 'zod';

type ParamWith<T> = Expand<T & { [key: string]: unknown }>;

const storeIdParamSchema = object({ storeId: string().uuid().nonempty() });
const billboardIdParamSchema = object({
  billboardId: string().uuid().nonempty(),
});

type ParamWithStoreId = ParamWith<TypeOf<typeof storeIdParamSchema>>;
type ParamWithBillboardId = ParamWith<TypeOf<typeof billboardIdParamSchema>>;

export { storeIdParamSchema, billboardIdParamSchema };
export type { ParamWithStoreId, ParamWithBillboardId };
