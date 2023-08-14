import { AnyZodObject, TypeOf, ZodObject, object, string } from 'zod';

type LabelParamKey<Param> = {
  readonly paramName: Param;
};

type TypeLooseDynamicZodObject<
  K extends string,
  Type extends AnyZodObject
> = ZodObject<{
  [P in K]: InferZodSchemaObject<Type>[string];
}>;

function createIdParamQuerySchema<K extends `${string}Id`>(
  param: LabelParamKey<K>
) {
  const key = param.paramName;

  const schema = object({
    [param.paramName]: string({
      required_error: getRequiredParamsMessage(key),
    })
      .uuid({ message: getNonUuidTypeMessage(key) })
      .nonempty(),
  });

  return <TypeLooseDynamicZodObject<K, typeof schema>>schema;
}

type InferZodSchemaObject<ZodSchemaObject extends object> =
  ZodSchemaObject extends ZodObject<infer Schema> ? Schema : never;

type ParamWith<T> = Expand<T & { [key: string]: unknown }>;
export const getRequiredParamsMessage = (key: string) =>
  `[Param] - ${key} is required`;

export const getNonUuidTypeMessage = (key: string) =>
  `Expect ${key} of type UUID`;
const storeIdParamSchema = createIdParamQuerySchema({ paramName: 'storeId' });

const categoryIdParamSchema = createIdParamQuerySchema({
  paramName: 'categoryId',
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
type ParamWithCategoryId = ParamWith<TypeOf<typeof categoryIdParamSchema>>;

export { storeIdParamSchema, billboardIdParamSchema, categoryIdParamSchema };
export type { ParamWithStoreId, ParamWithBillboardId, ParamWithCategoryId };
