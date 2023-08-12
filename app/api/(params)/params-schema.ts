import { TypeOf, object, string } from 'zod';

type ParamWith<T> = Expand<T & { [key: string]: unknown }>;
const getRequiredParamsMessage = (key: string) =>
  `[Param] - ${key} is required`;

const getNonUuidTypeMessage = (key: string) => `Expect ${key} of type UUID`;
const storeIdParamSchema = object({
  storeId: string({ required_error: getRequiredParamsMessage('storeId') })
    .uuid({ message: getNonUuidTypeMessage('storeId') })
    .nonempty(),
});

const billboardIdParamSchema = object({
  billboardId: string({
    required_error: getRequiredParamsMessage('billboardId'),
  })
    .uuid({ message: getNonUuidTypeMessage('billboardId') })
    .nonempty(),
});

type ParamWithStoreId = ParamWith<TypeOf<typeof storeIdParamSchema>>;
type ParamWithBillboardId = ParamWith<TypeOf<typeof billboardIdParamSchema>>;

export { storeIdParamSchema, billboardIdParamSchema };
export type { ParamWithStoreId, ParamWithBillboardId };
