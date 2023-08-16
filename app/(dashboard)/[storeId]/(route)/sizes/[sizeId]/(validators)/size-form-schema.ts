import { Sizes } from '@/schema/size';
import { TypeOf, object, string } from 'zod';

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

export { sizeFormSchema, type SizeFormPayload };
