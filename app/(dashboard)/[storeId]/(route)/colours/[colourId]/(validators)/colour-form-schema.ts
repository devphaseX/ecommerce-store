import { Sizes } from '@/schema/size';
import { TypeOf, object, string } from 'zod';

const colourFormSchema = object({
  name: string({
    required_error: 'name is required',
    invalid_type_error: 'name should be a text',
  }).nonempty(),
  value: string({
    required_error: 'value is required',
    invalid_type_error: 'value should be a text',
  })
    .min(4)
    .regex(/^#/, { message: 'String must be a valid hex code' }),
} satisfies Record<keyof Omit<Sizes, 'id' | 'createdAt' | 'updatedAt' | 'storeId'>, unknown>);

type ColourFormSchema = TypeOf<typeof colourFormSchema>;

export { colourFormSchema, type ColourFormSchema };
