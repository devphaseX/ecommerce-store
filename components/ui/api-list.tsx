'use client';

import { ParamWithStoreId } from '@/app/api/(params)/params-schema';
import { useOrigin } from '@/hooks/use-origin';
import { useParams } from 'next/navigation';
import { ApiAlert } from './api-alert';

interface ApiListProps {
  entityName: string;
  entityIdName: string;
}
export const ApiList: React.FC<ApiListProps> = ({
  entityIdName,
  entityName,
}) => {
  const params = useParams() as ParamWithStoreId;
  const origin = useOrigin();

  const baseUrl = `${origin}/api/stores/${params.storeId}`;

  return (
    <>
      <ApiAlert
        title="GET"
        variant="public"
        description={`${baseUrl}/${entityName}`}
      />
      <ApiAlert
        title="GET"
        variant="public"
        description={`${baseUrl}/${entityName}/{${entityIdName}}`}
      />
      <ApiAlert
        title="POST"
        variant="admin"
        description={`${baseUrl}/${entityName}`}
      />
      <ApiAlert
        title="PATCH"
        variant="admin"
        description={`${baseUrl}/${entityName}/{${entityIdName}}`}
      />
      <ApiAlert
        title="DELETE"
        variant="admin"
        description={`${baseUrl}/${entityName}/{${entityIdName}}`}
      />
    </>
  );
};
