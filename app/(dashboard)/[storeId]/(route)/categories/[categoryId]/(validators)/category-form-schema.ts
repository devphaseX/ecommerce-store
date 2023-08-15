import { Category } from '@/schema/category';
import { TypeOf, object, string } from 'zod';

const categoryFormSchema = object({
  name: string({
    required_error: 'Label is required',
    invalid_type_error: 'Label should be a text',
  }).nonempty(),
  billboardId: string({
    required_error: 'Billboard is required',
    invalid_type_error: 'Ensure you have a billboard selected',
  }).uuid({ message: 'Ensure you have a billboard selected' }),
} satisfies Record<keyof Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'storeId'>, unknown>);

type CategoryFormPayload = TypeOf<typeof categoryFormSchema>;

export { categoryFormSchema, type CategoryFormPayload };
