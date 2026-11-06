import type * as React from 'react';

import { cn } from '../lib/cn';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

export type NativeSelectOption = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

export type NativeSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly NativeSelectOption[];
  id?: string;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  /** Classes for the trigger, i.e. what a native `<select className>` styled. */
  className?: string;
  contentClassName?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
};

/*
 * Radix forbids `""` as an item value (it is reserved for "cleared"), but
 * native selects use it for "All …" options. Map it to a private sentinel.
 */
const EMPTY_VALUE = '__native_select_empty__';
const toRadix = (value: string) => (value === '' ? EMPTY_VALUE : value);
const fromRadix = (value: string) => (value === EMPTY_VALUE ? '' : value);

/**
 * shadcn Select with the shape and feel of a native `<select>`: a bordered
 * field with a chevron, an option list aligned over the trigger like the OS
 * picker, keyboard type-ahead, and a `value`/`onValueChange` string API.
 */
function NativeSelect({
  value,
  onValueChange,
  options,
  id,
  name,
  placeholder,
  disabled,
  required,
  className,
  contentClassName,
  ...aria
}: NativeSelectProps) {
  const hasEmptyOption = options.some((option) => option.value === '');
  // With no "" option, an empty value means "nothing chosen"; Radix renders
  // the placeholder for its own reserved "" value.
  const radixValue = value === '' && !hasEmptyOption ? '' : toRadix(value);

  return (
    <Select
      value={radixValue}
      onValueChange={(next) => onValueChange(fromRadix(next))}
      name={name}
      disabled={disabled}
      required={required}
    >
      <SelectTrigger
        id={id}
        data-slot="native-select"
        className={cn(
          'h-auto min-h-9 w-full cursor-pointer gap-2 rounded-md border border-input bg-background px-3 text-left text-sm text-foreground shadow-xs transition-colors hover:border-ring/50 data-[placeholder]:text-muted-foreground',
          className,
        )}
        {...aria}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        position="item-aligned"
        className={cn('max-h-80 rounded-lg shadow-lg', contentClassName)}
      >
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={toRadix(option.value)}
            disabled={option.disabled}
            className="cursor-pointer rounded-md py-2"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { NativeSelect };
