import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus } from 'lucide-react';

export function ClientHeaderSkeleton() {
  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}

export function ClientDetailsCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-5 w-32" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface ClientSectionSkeletonProps {
  title: string;
  buttonText: string;
  columns: string[];
  rows?: number;
}

export function ClientSectionSkeleton({ 
  title, 
  buttonText, 
  columns, 
  rows = 3 
}: ClientSectionSkeletonProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <Skeleton className="h-4 w-64 mt-1" />
          </div>
          <Button size="sm" disabled>
            <Plus className="h-4 w-4 mr-2" />
            {buttonText}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index} className={index >= columns.length - 2 ? "text-right" : ""}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((_, colIndex) => (
                  <TableCell key={colIndex} className={colIndex >= columns.length - 2 ? "text-right" : ""}>
                    {colIndex === columns.length - 1 ? (
                      // Actions column
                      <div className="flex items-center justify-end space-x-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    ) : colIndex === 0 ? (
                      // First column (usually has badge or special content)
                      <Skeleton className="h-6 w-24 rounded-md" />
                    ) : (
                      // Regular columns
                      <Skeleton className="h-4 w-20" />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function ClientDetailPageSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <ClientHeaderSkeleton />
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <ClientDetailsCardSkeleton />
        </div>
        
        <div className="md:col-span-2 space-y-6">
          <ClientSectionSkeleton
            title="Cuentas de Inversión"
            buttonText="Añadir Cuenta"
            columns={['Plataforma', 'Número de Cuenta', 'AUM', 'Fecha de Creación', 'Acciones']}
            rows={3}
          />
          
          <ClientSectionSkeleton
            title="Pólizas de Seguro"
            buttonText="Añadir Póliza"
            columns={['Número de Póliza', 'Tipo de Seguro', 'Prima', 'Cobertura', 'Fecha de Creación', 'Acciones']}
            rows={2}
          />
        </div>
      </div>
    </div>
  );
} 