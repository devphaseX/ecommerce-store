import { stores } from '@/schema/store';
import { db } from './initialize';

async function deleteAll() {
  const states = await Promise.allSettled([db.delete(stores).returning()]);
  states.forEach((item) => {
    if (item.status === 'rejected') throw item.reason;
  });
}

deleteAll().then(() => {
  console.log('deletion done');
});
