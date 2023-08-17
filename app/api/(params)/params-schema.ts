import {
  AnyZodObject,
  TypeOf,
  ZodObject,
  nativeEnum,
  object,
  string,
  z,
} from 'zod';

enum DynamicPath {
  UUID = 'uuid',
  PATH = 'path',
}

type LabelParamKey<Param, Defer extends boolean> = {
  readonly paramName: Param;
  defer?: Defer;
};

type TypeLooseDynamicZodObject<
  K extends string,
  Type extends AnyZodObject
> = ZodObject<{
  [P in K]: InferZodSchemaObject<Type>[string];
}>;

type InferZodSchemaObject<ZodSchemaObject extends object> =
  ZodSchemaObject extends ZodObject<infer Schema> ? Schema : never;

type ParamWith<T> = Expand<T & { [key: string]: unknown }>;
export const getRequiredParamsMessage = (key: string) =>
  `[Param] - ${key} is required`;

type ParamDeferQuerySchemaFn<K extends string, Schema extends AnyZodObject> = (
  validateAsUUID?: boolean
) => TypeLooseDynamicZodObject<K, Schema>;

type ParamQuerySchema<
  K extends string,
  Defer extends boolean,
  Schema extends AnyZodObject
> = Defer extends false | undefined
  ? TypeLooseDynamicZodObject<K, Schema>
  : ParamDeferQuerySchemaFn<K, Schema>;

function createIdParamQuerySchema<
  K extends `${string}Id`,
  Defer extends boolean
>(option: LabelParamKey<K, Defer>) {
  const key = option.paramName;

  function createSchema(treatAsUUID?: boolean) {
    const stringSchema = string({
      required_error: getRequiredParamsMessage(key),
    });
    const schema = object({
      [option.paramName]: treatAsUUID
        ? stringSchema.uuid({ message: getNonUuidTypeMessage(key) })
        : stringSchema.nonempty(),
    });
    return schema;
  }

  type SchemaType = ReturnType<typeof createSchema>;

  if (option.defer) {
    return createSchema as ParamQuerySchema<K, Defer, SchemaType>;
  }

  return createSchema() as ParamQuerySchema<K, Defer, SchemaType>;
}

function createDynamicPathSchema<K extends string, Schema extends AnyZodObject>(
  parser: ParamDeferQuerySchemaFn<K, Schema>,
  parseAsUUID?: boolean
) {
  if (parseAsUUID) {
    return parser(true).extend({
      type: nativeEnum(DynamicPath).default(DynamicPath.UUID),
    });
  }

  return z.union([
    parser(true).extend({
      type: nativeEnum(DynamicPath).default(DynamicPath.UUID),
    }),
    parser().extend({
      type: nativeEnum(DynamicPath).default(DynamicPath.PATH),
    }),
  ]);
}

export const getNonUuidTypeMessage = (key: string) =>
  `Expect ${key} of type UUID`;
const storeIdParamSchema = createIdParamQuerySchema({
  paramName: 'storeId',
  defer: false,
});

const categoryIdParamSchema = createIdParamQuerySchema({
  paramName: 'categoryId',
  defer: false,
});

const sizeIdParamSchema = createIdParamQuerySchema({
  paramName: 'sizeId',
  defer: true,
});

const productIdParamSchema = createIdParamQuerySchema({
  paramName: 'productId',
  defer: true,
});

const billboardIdParamSchema = object({
  billboardId: string({
    required_error: getRequiredParamsMessage('billboardId'),
  })
    .uuid({ message: getNonUuidTypeMessage('billboardId') })
    .nonempty(),
});

const colourIdParamSchema = createIdParamQuerySchema({
  paramName: 'colourId',
  defer: true,
});

type ParamWithStoreId = ParamWith<TypeOf<typeof storeIdParamSchema>>;
type ParamWithBillboardId = ParamWith<TypeOf<typeof billboardIdParamSchema>>;
type ParamWithCategoryId = ParamWith<TypeOf<typeof categoryIdParamSchema>>;
type ParamWithSizeId = ParamWith<TypeOf<ReturnType<typeof sizeIdParamSchema>>>;
type ParamWithColourId = ParamWith<
  TypeOf<ReturnType<typeof colourIdParamSchema>>
>;

type ParamWithProductId = ParamWith<
  TypeOf<ReturnType<typeof productIdParamSchema>>
>;

export {
  storeIdParamSchema,
  billboardIdParamSchema,
  categoryIdParamSchema,
  sizeIdParamSchema,
  DynamicPath,
  createDynamicPathSchema,
  colourIdParamSchema,
  productIdParamSchema,
};
export type {
  ParamWithStoreId,
  ParamWithBillboardId,
  ParamWithCategoryId,
  ParamWithSizeId,
  ParamWithProductId,
  ParamWithColourId,
};
