'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { InsurancePolicy } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { AddInsurancePolicyDialog } from './AddInsurancePolicyDialog';
import { EditInsurancePolicyDialog } from './EditInsurancePolicyDialog';

interface InsurancePoliciesSectionProps {
  clientId: number;
  policies: InsurancePolicy[];
  onDataChange: () => void;
}

export function InsurancePoliciesSection({
  clientId,
  policies,
  onDataChange,
}: InsurancePoliciesSectionProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<InsurancePolicy | null>(
    null
  );
  const [deletingPolicyId, setDeletingPolicyId] = useState<number | null>(null);

  const handleAddPolicy = async (policyData: {
    policy_number: string;
    insurance_type: string;
    premium_amount: number;
    coverage_amount: number;
  }) => {
    try {
      await apiClient.createInsurancePolicy(clientId, policyData);
      setIsAddModalOpen(false);
      // Only call onDataChange after successful operation
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error('Error creating insurance policy:', error);
      toast.error('Error al crear la póliza de seguro');
    }
  };

  const handleEditPolicy = async (
    policyId: number,
    policyData: {
      policy_number?: string;
      insurance_type?: string;
      premium_amount?: number;
      coverage_amount?: number;
    }
  ) => {
    const updatePromise = apiClient.updateInsurancePolicy(policyId, policyData);

    toast.promise(updatePromise, {
      loading: 'Actualizando póliza de seguro...',
      success: () => {
        setEditingPolicy(null);
        // Only call onDataChange after successful operation
        if (onDataChange) {
          onDataChange();
        }
        return '✅ Póliza de seguro actualizada con éxito';
      },
      error: (err) => {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'No se pudo actualizar la póliza';
        return `❌ Error: ${errorMessage}`;
      },
    });

    await updatePromise;
  };

  const handleDeletePolicy = async (policyId: number) => {
    if (
      !confirm('¿Estás seguro de que quieres eliminar esta póliza de seguro?')
    ) {
      return;
    }

    try {
      setDeletingPolicyId(policyId);

      const deletePromise = apiClient.deleteInsurancePolicy(policyId);

      toast.promise(deletePromise, {
        loading: 'Eliminando póliza de seguro...',
        success: () => {
          // Only call onDataChange after successful operation
          if (onDataChange) {
            onDataChange();
          }
          return '✅ Póliza de seguro eliminada con éxito';
        },
        error: (err) => {
          const errorMessage =
            err instanceof Error
              ? err.message
              : 'No se pudo eliminar la póliza';
          return `❌ Error: ${errorMessage}`;
        },
      });

      await deletePromise;
    } catch (error) {
      console.error('Error deleting insurance policy:', error);
    } finally {
      setDeletingPolicyId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalCoverage = policies.reduce(
    (sum, policy) => sum + policy.coverage_amount,
    0
  );
  const totalPremiums = policies.reduce(
    (sum, policy) => sum + policy.premium_amount,
    0
  );

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Pólizas de Seguro</CardTitle>
            <p className='mt-1 text-sm text-muted-foreground'>
              {policies.length} póliza{policies.length !== 1 ? 's' : ''} •
              Cobertura Total: {formatCurrency(totalCoverage)} • Primas:{' '}
              {formatCurrency(totalPremiums)}
            </p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} size='sm'>
            <Plus className='mr-2 h-4 w-4' />
            Añadir Póliza
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {policies.length === 0 ? (
          <div className='py-8 text-center text-muted-foreground'>
            <p>No hay pólizas de seguro registradas</p>
            <p className='mt-1 text-sm'>
              Haz clic en &quot;Añadir Póliza&quot; para comenzar
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número de Póliza</TableHead>
                <TableHead>Tipo de Seguro</TableHead>
                <TableHead className='text-right'>Prima</TableHead>
                <TableHead className='text-right'>Cobertura</TableHead>
                <TableHead>Fecha de Creación</TableHead>
                <TableHead className='text-right'>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell>
                    <Badge variant='outline'>{policy.policy_number}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className='font-medium'>{policy.insurance_type}</div>
                  </TableCell>
                  <TableCell className='text-right'>
                    {formatCurrency(policy.premium_amount)}
                  </TableCell>
                  <TableCell className='text-right font-medium'>
                    {formatCurrency(policy.coverage_amount)}
                  </TableCell>
                  <TableCell>
                    {new Date(policy.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex items-center justify-end space-x-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setEditingPolicy(policy)}
                      >
                        <Edit className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleDeletePolicy(policy.id)}
                        disabled={deletingPolicyId === policy.id}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <AddInsurancePolicyDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={handleAddPolicy}
      />

      {editingPolicy && (
        <EditInsurancePolicyDialog
          open={!!editingPolicy}
          onOpenChange={(open) => !open && setEditingPolicy(null)}
          policy={editingPolicy}
          onSubmit={(data) => handleEditPolicy(editingPolicy.id, data)}
        />
      )}
    </Card>
  );
}
