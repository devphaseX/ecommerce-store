import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Image } from '../schema';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatter = Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function setCookie(cName: string, cValue: string, expTime: number) {
  let date = new Date();
  date.setTime(date.getTime() + expTime);
  const expires = 'expires=' + date.toUTCString();
  document.cookie = cName + '=' + cValue + '; ' + expires + '; path=/';
}
