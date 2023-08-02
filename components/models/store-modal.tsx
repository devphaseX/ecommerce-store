'use client';
import { Modal } from '@/ui/modal';
import { useStoreModal } from '@/hooks/use-store-modal';
import { TypeOf, object, string } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/form';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';

const formSchema = object({
  name: string().nonempty({ message: 'Please provide a name for the store' }),
});

export type CreateStoreFormPayload = TypeOf<typeof formSchema>;

export const StoreModal = () => {
  const { isOpen, onClose, onOpen } = useStoreModal();
  const form = useForm<CreateStoreFormPayload>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = form.handleSubmit(async function submitCreateStoreForm(
    formValues
  ) {
    //Create store
    console.log({ formValues });
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create store "
      description="Add a new store to manage products and categories"
    >
      <div>
        <div className="space-y-4 py-2 pb-4">
          <Form {...form}>
            <form onSubmit={onSubmit}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E-commerce" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="pt-6 space-x-2 flex items-center justify-end w-full">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">Continue</Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </Modal>
  );
};
