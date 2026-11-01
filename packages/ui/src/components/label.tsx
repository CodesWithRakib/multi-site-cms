import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '../lib/cn';

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 select-none',
);

export type LabelProps = React.ComponentProps<typeof LabelPrimitive.Root> &
  VariantProps<typeof labelVariants>;

function Label({ className, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root data-slot="label" className={cn(labelVariants(), className)} {...props} />
  );
}

export { Label };
