import { BillBoard } from '@/schema/bill-board';
import { TypeOf, object, string } from 'zod';

const billBoardFormSchema = object({
  label: string({
    required_error: 'Label is required',
    invalid_type_error: 'Label should be a text',
  }).nonempty(),
  imageUrl: string({
    required_error: 'imageUrl is required',
    invalid_type_error: 'ImageUrl should be a url',
  }).url(),
} satisfies Record<keyof Omit<BillBoard, 'id' | 'createdAt' | 'updatedAt' | 'storeId'>, unknown>);

type BillBoardFormPayload = TypeOf<typeof billBoardFormSchema>;

export { billBoardFormSchema, type BillBoardFormPayload };
