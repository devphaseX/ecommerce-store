import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Image } from '../schema';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ClassifyImageOption = {
  serverSavedImages: Array<Image>;
  clientSentImages: Array<{ url: string }>;
};

export function classifyImageServer({
  serverSavedImages,
  clientSentImages,
}: ClassifyImageOption) {
  const removeServerImage: Array<Image> = [];
  const keptImages: Array<Image> = [];

  for (let serverImage of serverSavedImages) {
    const clientRetainedImage = clientSentImages.find(
      (clientImage) =>
        clientImage.url.replace(/(https?:[/]{2})?/, '') ===
        serverImage.url.replace(/(https?:[/]{2})?/, '')
    );

    if (clientRetainedImage) {
      keptImages.push(serverImage);
    } else {
      removeServerImage.push(serverImage);
    }
  }

  const newlyAddedImage: { url: string }[] = clientSentImages.filter(
    (clientImage) =>
      keptImages.find(
        (kept) =>
          kept.url.replace(/(https?:[/]{2})?/, '') ===
          clientImage.url.replace(/(https?:[/]{2})?/, '')
      )
  );

  return { removeServerImage, keptImages, newlyAddedImage };
}
