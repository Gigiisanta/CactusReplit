'use client';

import { useState } from 'react';
import { InvestmentAccount } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, TrendingUp, Eye, EyeOff } from 'lucide-react';
import { AddInvestmentAccountDialog } from './AddInvestmentAccountDialog';

interface SimplifiedInvestmentAccountsProps {
  clientId: number;
  accounts: InvestmentAccount[];
  onDataChange: () => void;
}

export function SimplifiedInvestmentAccounts({
  clientId,
  accounts,
  onDataChange,
}: SimplifiedInvestmentAccountsProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleAddAccount = async (accountData: {
    platform: string;
    account_number?: string;
    aum: number;
  }) => {
    await onDataChange();
    setIsAddModalOpen(false);
  };

  const totalAUM = accounts.reduce((sum, account) => sum + account.aum, 0);

  return (
    <Card className='w-full'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <TrendingUp className='h-5 w-5' />
            Cuentas de Inversión
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
          <div className='grid grid-cols-2 gap-4'>
            <div className='rounded-lg bg-blue-50 p-4 text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {accounts.length}
              </div>
              <div className='text-sm text-gray-600'>Cuentas</div>
            </div>
            <div className='rounded-lg bg-green-50 p-4 text-center'>
              <div className='text-2xl font-bold text-green-600'>
                US$ {totalAUM.toLocaleString()}
              </div>
              <div className='text-sm text-gray-600'>AUM Total</div>
            </div>
          </div>

          {/* Detalles (cuando se muestra) */}
          {showDetails && (
            <div className='border-t pt-4'>
              {accounts.length === 0 ? (
                <div className='py-8 text-center text-gray-500'>
                  No hay cuentas de inversión registradas
                </div>
              ) : (
                <div className='space-y-2'>
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className='flex items-center justify-between rounded-lg bg-gray-50 p-3'
                    >
                      <div className='flex items-center gap-3'>
                        <Badge variant='outline'>{account.platform}</Badge>
                        {account.account_number && (
                          <span className='text-sm text-gray-600'>
                            {account.account_number}
                          </span>
                        )}
                      </div>
                      <div className='text-right'>
                        <div className='font-medium'>
                          US$ {account.aum.toLocaleString()}
                        </div>
                        <div className='text-xs text-gray-500'>AUM</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <AddInvestmentAccountDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={handleAddAccount}
      />
    </Card>
  );
}
