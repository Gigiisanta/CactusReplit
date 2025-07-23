'use client';

import { Suspense, lazy } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy components
const DashboardKPIs = lazy(() => import('./components/DashboardKPIs'));
const DashboardRecentActivity = lazy(
  () => import('./components/DashboardRecentActivity')
);
const DashboardActions = lazy(() => import('./components/DashboardActions'));

// Loading skeletons
const DashboardKPIsSkeleton = () => (
  <div className='grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-3'>
    {[...Array(3)].map((_, i) => (
      <Card key={i} className='card-hover'>
        <CardContent className='p-6'>
          <div className='space-y-3'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-8 w-16' />
            <Skeleton className='h-3 w-32' />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const DashboardRecentActivitySkeleton = () => (
  <Card className='card-hover'>
    <CardContent className='p-6'>
      <div className='space-y-3'>
        <Skeleton className='h-6 w-32' />
        <Skeleton className='h-4 w-48' />
        {[...Array(3)].map((_, i) => (
          <div key={i} className='flex items-center space-x-3'>
            <Skeleton className='h-2 w-2 rounded-full' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-3 w-24' />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const DashboardActionsSkeleton = () => (
  <Card className='card-hover'>
    <CardContent className='p-6'>
      <div className='space-y-3'>
        <Skeleton className='h-6 w-32' />
        <Skeleton className='h-4 w-48' />
        <div className='flex gap-2'>
          <Skeleton className='h-10 w-32' />
          <Skeleton className='h-10 w-32' />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-slate-900'>Dashboard</h1>
        <p className='text-slate-600'>
          Resumen de tu cartera de clientes y métricas clave
        </p>
      </div>

      {/* KPIs con lazy loading */}
      <Suspense fallback={<DashboardKPIsSkeleton />}>
        <DashboardKPIs />
      </Suspense>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Recent Activity con lazy loading */}
        <Suspense fallback={<DashboardRecentActivitySkeleton />}>
          <DashboardRecentActivity />
        </Suspense>

        {/* Dashboard Actions con lazy loading */}
        <Suspense fallback={<DashboardActionsSkeleton />}>
          <DashboardActions />
        </Suspense>
      </div>
    </div>
  );
}
