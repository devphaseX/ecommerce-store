import { Alert, AlertDescription, AlertTitle } from '@/ui/alert';
import { Copy, Server } from 'lucide-react';
import { Badge, BadgeProps } from './badge';
import { Button } from './button';
import toast from 'react-hot-toast';

type ApiAlertVariant = 'public' | 'admin';

interface ApiAlertProps {
  title: string;
  description: string;
  variant?: ApiAlertVariant;
}

type TextMap = Record<ApiAlertVariant, string>;
type VariantMap = Record<ApiAlertVariant, BadgeProps['variant']>;

const textMap: TextMap = {
  public: 'Public',
  admin: 'Admin',
};

const variantMap: VariantMap = {
  public: 'secondary',
  admin: 'destructive',
};

export const ApiAlert: React.FC<ApiAlertProps> = ({
  title,
  description,
  variant = 'public',
}) => {
  function onDescriptionCopy() {
    navigator.clipboard.writeText(description);
    toast.success('API Route copied to the clipboard');
  }
  return (
    <Alert>
      <Server className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-x-2">
        {title}
        <Badge variant={variantMap[variant]}>{textMap[variant]}</Badge>
      </AlertTitle>
      <AlertDescription className="mt-4 flex items-center justify-between">
        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
          {description}
        </code>
        <Button variant="outline" size="icon" onClick={onDescriptionCopy}>
          <Copy className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
};
