'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@multi-site-cms/ui';

import { useGetHealthQuery } from '@/lib/store';

export function PlatformStatus() {
  const { data, error, isFetching, isLoading, refetch } = useGetHealthQuery();

  const isOnline = Boolean(data);
  const statusLabel =
    isLoading || isFetching ? 'Checking API' : isOnline ? 'API online' : 'API offline';
  const message = error && 'message' in error ? error.message : null;

  return (
    <Card className="border-primary/15 bg-card/90">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Platform connectivity</CardTitle>
          <Badge
            variant={isOnline ? 'default' : isLoading || isFetching ? 'secondary' : 'destructive'}
          >
            {statusLabel}
          </Badge>
        </div>
        <CardDescription>
          The admin application checks the API&apos;s public liveness endpoint. This verifies the
          browser-to-API boundary without depending on the database.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <div
          className="text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {data
            ? `Connected to ${data.service} · uptime ${data.uptimeSeconds}s`
            : (message ?? 'Waiting for the API to become available.')}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          {isFetching ? 'Checking…' : 'Check again'}
        </Button>
      </CardContent>
    </Card>
  );
}
