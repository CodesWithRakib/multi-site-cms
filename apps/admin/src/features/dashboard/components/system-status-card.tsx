'use client';

import React from 'react';
import { Server, Layers, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@multi-site-cms/ui';
import { useGetPublishingHealthQuery } from '@/lib/cms-api';
import { useAdmin } from '@/lib/admin-context';

export function SystemStatusCard() {
  const { t } = useAdmin();
  const {
    data: health,
    isLoading,
    isError,
  } = useGetPublishingHealthQuery(undefined, {
    pollingInterval: 30000,
  });

  const isHealthy = !isError;
  const isWorkerActive = health
    ? health.isScheduledWorkerActive && health.isOutboxDispatcherActive
    : true;
  const scheduledCount = health?.scheduledPublicationsPending ?? 0;

  // Only signals we really measure: the API answered, and the publishing workers.
  const services = [
    {
      id: 'api',
      name: t('dashboard.apiServer'),
      status: isHealthy ? t('dashboard.online') : 'Degraded',
      sub: isHealthy ? 'Responding' : 'Error',
      icon: Server,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-50 dark:bg-blue-950/50',
      online: isHealthy,
    },
    {
      id: 'publishing',
      name: t('dashboard.publishingEngine'),
      status: isWorkerActive ? t('dashboard.online') : t('dashboard.standby'),
      sub: `${scheduledCount} in queue`,
      icon: Layers,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
      online: isWorkerActive,
    },
  ];

  return (
    <Card className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs h-full">
      <CardHeader className="p-6 pb-4 border-b-0 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <span
            className={`size-2.5 rounded-full ${
              isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white font-sans">
            {t('dashboard.systemStatus')}
          </CardTitle>
        </div>

        <div
          className={`flex items-center gap-1.5 text-xs font-semibold ${
            isHealthy
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-amber-600 dark:text-amber-400'
          }`}
        >
          <span>
            {isHealthy ? t('dashboard.allSystemsOperational') : t('dashboard.telemetryWarning')}
          </span>
          {isHealthy ? (
            <CheckCircle2 className="size-3.5" />
          ) : (
            <AlertTriangle className="size-3.5" />
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-1">
        <div className="grid grid-cols-2 gap-3.5">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors"
              >
                <div
                  className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${service.iconBg}`}
                >
                  <Icon className={`size-4.5 ${service.iconColor}`} />
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {service.name}
                  </span>
                  <div
                    className={`flex items-center gap-1 text-[11px] font-medium mt-0.5 ${
                      service.online
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        service.online ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <span>{isLoading ? 'Checking...' : service.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
