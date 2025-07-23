import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardKPIsSkeleton() {
  return (
    <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
      {[...Array(3)].map((_, i) => (
        <Card key={i} className='card-hover'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-4 w-4' />
          </CardHeader>
          <CardContent>
            <Skeleton className='mb-2 h-8 w-16' />
            <Skeleton className='h-3 w-32' />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
