import * as SeparatorPrimitive from '@radix-ui/react-separator';
import type * as React from 'react';

import { cn } from '../lib/cn';

export type SeparatorProps = React.ComponentProps<typeof SeparatorPrimitive.Root>;

function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: SeparatorProps) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
