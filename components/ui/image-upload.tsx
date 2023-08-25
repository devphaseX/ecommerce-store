'use client';

import { useIsMounted } from 'usehooks-ts';
import { Button } from './button';
import { ImagePlus, Trash } from 'lucide-react';
import Image from 'next/image';
import { CldUploadWidget } from 'next-cloudinary';

interface ImageUploadProps {
  disable?: boolean;
  onChange: (value: string) => void;
  onRemove: (value: string) => void;
  value: string[];
}

interface CloudinaryAssumeImageUploadType {
  info: { secure_url: string };
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onChange,
  onRemove,
  value,
  disable,
}) => {
  const mounted = useIsMounted();
  if (!mounted) return null;

  const onUpload = (result: unknown) => {
    if ('info' in (Object(result) as CloudinaryAssumeImageUploadType)) {
      onChange((result as CloudinaryAssumeImageUploadType).info.secure_url);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        {value.map((imgUrl, i) => (
          <div
            key={`${i}-${imgUrl}`}
            className="relative w-[200px] h-[200px] rounded-md overflow-hidden"
          >
            <div className="absolute z-10 top-2 right-2">
              <Button
                type="button"
                onClick={() => onRemove(imgUrl)}
                variant="destructive"
                size="icon"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
            {imgUrl ? (
              <Image fill className="object-cover" alt="image" src={imgUrl} />
            ) : null}
          </div>
        ))}
      </div>
      <CldUploadWidget onUpload={onUpload} uploadPreset="ecommerce-store">
        {({ open }) => {
          const onClick = () => {
            open?.();
          };

          return (
            <Button
              type="button"
              disabled={disable}
              variant="secondary"
              onClick={onClick}
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              Upload an image
            </Button>
          );
        }}
      </CldUploadWidget>
    </div>
  );
};

export { ImageUpload };
