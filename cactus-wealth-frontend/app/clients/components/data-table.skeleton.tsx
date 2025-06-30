import { Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

interface DataTableSkeletonProps {
  rows?: number;
}

export function DataTableSkeleton({ rows = 8 }: DataTableSkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Toolbar skeleton */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            className="pl-8"
            disabled
          />
        </div>
      </div>
      
      {/* Table skeleton */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="font-semibold">
                <Skeleton className="h-4 w-12" />
              </TableHead>
              <TableHead className="font-semibold">
                <Skeleton className="h-4 w-20" />
              </TableHead>
              <TableHead className="font-semibold">
                <Skeleton className="h-4 w-20" />
              </TableHead>
              <TableHead className="font-semibold">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="font-semibold">
                <Skeleton className="h-4 w-12" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, index) => (
              <TableRow key={index}>
                <TableCell className="py-3">
                  <div className="flex flex-col space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex flex-wrap gap-1">
                    <Skeleton className="h-5 w-16 rounded-md" />
                    <Skeleton className="h-5 w-12 rounded-md" />
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <div className="max-w-[200px]">
                    <Skeleton className="h-4 w-full" />
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <Skeleton className="h-5 w-10 rounded-md" />
                </TableCell>
                <TableCell className="py-3">
                  <Skeleton className="h-4 w-16" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Footer skeleton */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
} 