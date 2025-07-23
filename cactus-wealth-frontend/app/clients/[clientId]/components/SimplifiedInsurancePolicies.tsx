'use client';

import { useState } from 'react';
import { InsurancePolicy } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Shield, Eye, EyeOff } from 'lucide-react';
import { AddInsurancePolicyDialog } from './AddInsurancePolicyDialog';

interface SimplifiedInsurancePoliciesProps {
  clientId: number;
  policies: InsurancePolicy[];
  onDataChange: () => void;
}

export function SimplifiedInsurancePolicies({
  clientId,
  policies,
  onDataChange,
}: SimplifiedInsurancePoliciesProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleAddPolicy = async (policyData: {
    policy_number: string;
    insurance_type: string;
    premium_amount: number;
    coverage_amount: number;
  }) => {
    await onDataChange();
    setIsAddModalOpen(false);
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
    <Card className='w-full'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            Pólizas de Seguro
          </CardTitle>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? (
                <>
                  <EyeOff className='mr-1 h-4 w-4' />
                  Ocultar
                </>
              ) : (
                <>
                  <Eye className='mr-1 h-4 w-4' />
                  Ver
                </>
              )}
            </Button>
            <Button size='sm' onClick={() => setIsAddModalOpen(true)}>
              <Plus className='mr-1 h-4 w-4' />
              Agregar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {/* Resumen */}
          <div className='grid grid-cols-3 gap-4'>
            <div className='rounded-lg bg-blue-50 p-4 text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {policies.length}
              </div>
              <div className='text-sm text-gray-600'>Pólizas</div>
            </div>
            <div className='rounded-lg bg-green-50 p-4 text-center'>
              <div className='text-2xl font-bold text-green-600'>
                US$ {totalCoverage.toLocaleString()}
              </div>
              <div className='text-sm text-gray-600'>Cobertura Total</div>
            </div>
            <div className='rounded-lg bg-purple-50 p-4 text-center'>
              <div className='text-2xl font-bold text-purple-600'>
                US$ {totalPremiums.toLocaleString()}
              </div>
              <div className='text-sm text-gray-600'>Primas Totales</div>
            </div>
          </div>

          {/* Detalles (cuando se muestra) */}
          {showDetails && (
            <div className='border-t pt-4'>
              {policies.length === 0 ? (
                <div className='py-8 text-center text-gray-500'>
                  No hay pólizas de seguro registradas
                </div>
              ) : (
                <div className='space-y-2'>
                  {policies.map((policy) => (
                    <div
                      key={policy.id}
                      className='flex items-center justify-between rounded-lg bg-gray-50 p-3'
                    >
                      <div className='flex items-center gap-3'>
                        <Badge variant='outline'>{policy.insurance_type}</Badge>
                        <span className='text-sm text-gray-600'>
                          {policy.policy_number}
                        </span>
                      </div>
                      <div className='text-right'>
                        <div className='font-medium'>
                          US$ {policy.coverage_amount.toLocaleString()}
                        </div>
                        <div className='text-xs text-gray-500'>
                          Prima: US$ {policy.premium_amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <AddInsurancePolicyDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={handleAddPolicy}
      />
    </Card>
  );
}
