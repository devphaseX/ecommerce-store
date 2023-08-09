'use client';

import { useIsClient, useIsMounted } from 'usehooks-ts';

export const useOrigin = () => {
  const mounted = useIsMounted();
  const client = useIsClient();

  if (!(mounted() && client)) return null;

  return window.location.origin;
};
