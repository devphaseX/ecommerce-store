import { TypeOf, object, string } from 'zod';

export const createStoreFormSchema = object({
  name: string()
    .nonempty({ message: 'Please provide a name for the store' })
    .toLowerCase(),
});

export type CreateStoreFormPayload = TypeOf<typeof createStoreFormSchema>;
