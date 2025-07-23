'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { InvestmentAccount } from '@/types';
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
import { AddInvestmentAccountDialog } from './AddInvestmentAccountDialog';
import { EditInvestmentAccountDialog } from './EditInvestmentAccountDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRef } from 'react';
import { apiClientInterceptor } from '@/lib/apiClient';

interface InvestmentAccountsSectionProps {
  clientId: number;
  accounts: InvestmentAccount[];
  onDataChange: () => void;
}

export function InvestmentAccountsSection({
  clientId,
  accounts,
  onDataChange,
}: InvestmentAccountsSectionProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] =
    useState<InvestmentAccount | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<number | null>(
    null
  );
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAddAccount = async (accountData: {
    platform: string;
    account_number?: string;
    aum: number;
  }) => {
    try {
      await apiClient.createInvestmentAccount(clientId, accountData);
      setIsAddModalOpen(false);
      // Only call onDataChange after successful operation
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error('Error creating investment account:', error);
      toast.error('Error al crear la cuenta de inversión');
    }
  };

  const handleEditAccount = async (
    accountId: number,
    accountData: {
      platform?: string;
      account_number?: string;
      aum?: number;
    }
  ) => {
    const updatePromise = apiClient.updateInvestmentAccount(
      accountId,
      accountData
    );

    toast.promise(updatePromise, {
      loading: 'Actualizando cuenta de inversión...',
      success: () => {
        setEditingAccount(null);
        // Only call onDataChange after successful operation
        if (onDataChange) {
          onDataChange();
        }
        return '✅ Cuenta de inversión actualizada con éxito';
      },
      error: (err) => {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'No se pudo actualizar la cuenta';
        return `❌ Error: ${errorMessage}`;
      },
    });

    await updatePromise;
  };

  const handleDeleteAccount = async (accountId: number) => {
    if (
      !confirm(
        '¿Estás seguro de que quieres eliminar esta cuenta de inversión?'
      )
    ) {
      return;
    }

    try {
      setDeletingAccountId(accountId);

      const deletePromise = apiClient.deleteInvestmentAccount(accountId);

      toast.promise(deletePromise, {
        loading: 'Eliminando cuenta de inversión...',
        success: () => {
          // Only call onDataChange after successful operation
          if (onDataChange) {
            onDataChange();
          }
          return '✅ Cuenta de inversión eliminada con éxito';
        },
        error: (err) => {
          const errorMessage =
            err instanceof Error
              ? err.message
              : 'No se pudo eliminar la cuenta';
          return `❌ Error: ${errorMessage}`;
        },
      });

      await deletePromise;
    } catch (error) {
      console.error('Error deleting investment account:', error);
    } finally {
      setDeletingAccountId(null);
    }
  };

  const handleBulkUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await apiClientInterceptor
        .getClient()
        .post(
          `/clients/${clientId}/investment-accounts/bulk-upload/`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );
      toast.success('Cuentas importadas/actualizadas correctamente');
      setIsBulkModalOpen(false);
      // Only call onDataChange after successful operation
      if (onDataChange) {
        onDataChange();
      }
    } catch (err) {
      toast.error('Error al importar cuentas');
    } finally {
      setIsUploading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalAUM = accounts.reduce((sum, account) => sum + account.aum, 0);

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Cuentas de Inversión</CardTitle>
            <p className='mt-1 text-sm text-muted-foreground'>
              {accounts.length} cuenta{accounts.length !== 1 ? 's' : ''} • Total
              AUM: {formatCurrency(totalAUM)}
            </p>
          </div>
          <div className='flex gap-2'>
            <Button onClick={() => setIsAddModalOpen(true)} size='sm'>
              <Plus className='mr-2 h-4 w-4' />
              Añadir Cuenta
            </Button>
            <Button
              variant='outline'
              onClick={() => setIsBulkModalOpen(true)}
              size='sm'
            >
              <Upload className='mr-2 h-4 w-4' />
              Importar Excel/CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <div className='py-8 text-center text-muted-foreground'>
            <p>No hay cuentas de inversión registradas</p>
            <p className='mt-1 text-sm'>
              Haz clic en &quot;Añadir Cuenta&quot; para comenzar
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plataforma</TableHead>
                <TableHead>Número de Cuenta</TableHead>
                <TableHead className='text-right'>AUM</TableHead>
                <TableHead>Fecha de Creación</TableHead>
                <TableHead className='text-right'>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <div className='font-medium'>{account.platform}</div>
                  </TableCell>
                  <TableCell>
                    {account.account_number ? (
                      <Badge variant='outline'>{account.account_number}</Badge>
                    ) : (
                      <span className='text-muted-foreground'>N/A</span>
                    )}
                  </TableCell>
                  <TableCell className='text-right font-medium'>
                    {formatCurrency(account.aum)}
                  </TableCell>
                  <TableCell>
                    {new Date(account.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex items-center justify-end space-x-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setEditingAccount(account)}
                      >
                        <Edit className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleDeleteAccount(account.id)}
                        disabled={deletingAccountId === account.id}
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

      <AddInvestmentAccountDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={handleAddAccount}
      />

      {editingAccount && (
        <EditInvestmentAccountDialog
          open={!!editingAccount}
          onOpenChange={(open) => !open && setEditingAccount(null)}
          account={editingAccount}
          onSubmit={(data) => handleEditAccount(editingAccount.id, data)}
        />
      )}

      <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar cuentas de inversión (Excel/CSV)</DialogTitle>
          </DialogHeader>
          <input
            ref={fileInputRef}
            type='file'
            accept='.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel'
            aria-label='importar cuentas de inversión'
            onChange={(e) => {
              if (e.target.files?.[0]) handleBulkUpload(e.target.files[0]);
            }}
            disabled={isUploading}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
