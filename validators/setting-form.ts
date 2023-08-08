import { TypeOf, object, string } from 'zod';

export const settingsFormSchema = object({
  name: string()
    .min(1, { message: 'Name should contain a min of 1 character.' })
    .toLowerCase(),
});

export type SettingsFormValues = TypeOf<typeof settingsFormSchema>;
