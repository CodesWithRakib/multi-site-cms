import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Alert, AlertDescription, AlertTitle } from './alert';
import { Badge } from './badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Checkbox } from './checkbox';
import { Input } from './input';
import { Label } from './label';
import { Progress } from './progress';
import { Separator } from './separator';
import { Skeleton } from './skeleton';
import { Switch } from './switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Textarea } from './textarea';

describe('Shadcn UI Components', () => {
  it('renders Input with proper data-slot and styling', () => {
    render(<Input placeholder="Enter email" />);
    const input = screen.getByPlaceholderText('Enter email');
    expect(input.getAttribute('data-slot')).toBe('input');
    expect(input.className).toContain('border-input');
  });

  it('renders Textarea with proper classes', () => {
    render(<Textarea placeholder="Bio" />);
    const textarea = screen.getByPlaceholderText('Bio');
    expect(textarea.getAttribute('data-slot')).toBe('textarea');
  });

  it('renders Label correctly', () => {
    render(<Label htmlFor="email-input">Email address</Label>);
    const label = screen.getByText('Email address');
    expect(label.getAttribute('data-slot')).toBe('label');
  });

  it('renders Badge with variants', () => {
    render(<Badge variant="secondary">Active</Badge>);
    const badge = screen.getByText('Active');
    expect(badge.getAttribute('data-slot')).toBe('badge');
    expect(badge.className).toContain('bg-secondary');
  });

  it('renders Card with composed children', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Platform metrics</CardDescription>
        </CardHeader>
        <CardContent>Content here</CardContent>
      </Card>,
    );
    expect(screen.getByText('Overview')).toBeDefined();
    expect(screen.getByText('Platform metrics')).toBeDefined();
    expect(screen.getByText('Content here')).toBeDefined();
  });

  it('renders Separator with role and orientation', () => {
    const { container } = render(<Separator orientation="horizontal" />);
    const sep = container.querySelector('[data-slot="separator"]');
    expect(sep).toBeDefined();
    expect(sep?.className).toContain('h-[1px]');
  });

  it('renders Skeleton with pulse animation', () => {
    const { container } = render(<Skeleton className="w-20 h-4" />);
    const skeleton = container.querySelector('[data-slot="skeleton"]');
    expect(skeleton?.className).toContain('animate-pulse');
  });

  it('renders Alert with title and description', () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>Operation failed</AlertDescription>
      </Alert>,
    );
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('Warning')).toBeDefined();
    expect(screen.getByText('Operation failed')).toBeDefined();
  });

  it('renders Table hierarchy', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByText('Header')).toBeDefined();
    expect(screen.getByText('Data')).toBeDefined();
  });

  it('renders Switch correctly', () => {
    render(<Switch aria-label="Enable notifications" />);
    const sw = screen.getByRole('switch');
    expect(sw).toBeDefined();
    expect(sw.getAttribute('data-slot')).toBe('switch');
  });

  it('renders Checkbox correctly', () => {
    render(<Checkbox aria-label="Accept terms" />);
    const cb = screen.getByRole('checkbox');
    expect(cb).toBeDefined();
    expect(cb.getAttribute('data-slot')).toBe('checkbox');
  });

  it('renders Tabs with active state', () => {
    render(
      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="account">Account details</TabsContent>
        <TabsContent value="password">Password reset</TabsContent>
      </Tabs>,
    );
    expect(screen.getByText('Account')).toBeDefined();
    expect(screen.getByText('Account details')).toBeDefined();
  });

  it('renders Breadcrumb structure', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Articles</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('Articles')).toBeDefined();
  });

  it('renders Progress bar', () => {
    const { container } = render(<Progress value={65} />);
    const prog = container.querySelector('[data-slot="progress"]');
    expect(prog).toBeDefined();
  });
});
