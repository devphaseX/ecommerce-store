'use client';

import React, { FC, useMemo, useState } from 'react';
import { PopoverTrigger, Popover, PopoverContent } from '@/ui/popover';
import { Stores } from '../schema';
import { useStoreModal } from '@/hooks/use-store-modal';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayoutParams } from '@/app/(dashboard)/[storeId]/layout';
import { Button } from '@/ui/button';
import {
  Check,
  ChevronsUpDown,
  PlusCircle,
  Store as StoreIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/ui/command';

type PopoverTriggerProps = React.ComponentPropsWithoutRef<
  typeof PopoverTrigger
>;
interface StoreSwitcherProps extends PopoverTriggerProps {
  ownedStores: Array<Stores>;
}

type StoreRoute = { label: string; value: string };

export const StoreSwitcher: FC<StoreSwitcherProps> = ({
  ownedStores,
  className,
  ...props
}) => {
  const storeModal = useStoreModal();
  const params = useParams() as DashboardLayoutParams;
  const router = useRouter();

  const [switcherOpen, setSwitcherOpenState] = useState(false);

  const storeRoutes = useMemo(
    () =>
      ownedStores.map(
        (store): StoreRoute => ({ label: store.name!, value: store.id })
      ),
    [ownedStores]
  );

  const activeStore = storeRoutes.find(({ value }) => value === params.storeId);

  const onStoreSelect = (nextStoreRoute: StoreRoute) => {
    setSwitcherOpenState(false);
    router.push(`/${nextStoreRoute.value}`); //nextStoreRoute.value refernce to the store id
  };

  return (
    <>
      <Popover open={switcherOpen} onOpenChange={setSwitcherOpenState}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            role="combobox"
            aria-expanded={switcherOpen}
            aria-label="Select a store"
            className={cn('w-[200px] justify-between', className)}
          >
            <StoreIcon className="mr-2 h-4 w-4" />
            {activeStore?.label ?? 'no store'}
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="search store..." />
              <CommandEmpty>No store found</CommandEmpty>
              <CommandGroup heading="stores">
                {storeRoutes.map((store) => (
                  <CommandItem
                    key={store.value}
                    onSelect={() => onStoreSelect(store)}
                    className="text-sm"
                  >
                    <StoreIcon className="mr-2 h-4 w-4" />
                    {store.label}
                    <Check
                      className={cn(
                        'ml-auto h-4 w-4',
                        activeStore?.value === store.value
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setSwitcherOpenState(false);
                    storeModal.onOpen();
                    console.log({ opened: storeModal.isOpen });
                  }}
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Create store
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
};
