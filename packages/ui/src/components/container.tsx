import type * as React from 'react';

import { cn } from '../lib/cn';

function Container({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('mx-auto w-full max-w-6xl px-6', className)} {...props} />;
}

export { Container };
