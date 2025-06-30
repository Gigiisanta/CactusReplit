'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { InvestmentAccount } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { AddInvestmentAccountDialog } from './AddInvestmentAccountDialog';
import { EditInvestmentAccountDialog } from './EditInvestmentAccountDialog';

interface InvestmentAccountsSectionProps {
  clientId: number;
  accounts: InvestmentAccount[];
  onDataChange: () => void;
}

export function InvestmentAccountsSection({ clientId, accounts, onDataChange }: InvestmentAccountsSectionProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<InvestmentAccount | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<number | null>(null);

  const handleAddAccount = async (accountData: {
    platform: string;
    account_number?: string;
    aum: number;
  }) => {
    await apiClient.createInvestmentAccount(clientId, accountData);
    setIsAddModalOpen(false);
    onDataChange(); // Refresh to get updated data
  };

  const handleEditAccount = async (accountId: number, accountData: {
    platform?: string;
    account_number?: string;
    aum?: number;
  }) => {
    const updatePromise = apiClient.updateInvestmentAccount(accountId, accountData);
    
    toast.promise(updatePromise, {
      loading: 'Actualizando cuenta de inversión...',
      success: () => {
        setEditingAccount(null);
        onDataChange(); // Refresh to get updated data
        return '✅ Cuenta de inversión actualizada con éxito';
      },
      error: (err) => {
        const errorMessage = err instanceof Error ? err.message : 'No se pudo actualizar la cuenta';
        return `❌ Error: ${errorMessage}`;
      },
    });

    await updatePromise;
  };

  const handleDeleteAccount = async (accountId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta cuenta de inversión?')) {
      return;
    }

    try {
      setDeletingAccountId(accountId);
      
      const deletePromise = apiClient.deleteInvestmentAccount(accountId);
      
      toast.promise(deletePromise, {
        loading: 'Eliminando cuenta de inversión...',
        success: () => {
          onDataChange(); // Refresh to get updated data
          return '✅ Cuenta de inversión eliminada con éxito';
        },
        error: (err) => {
          const errorMessage = err instanceof Error ? err.message : 'No se pudo eliminar la cuenta';
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cuentas de Inversión</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {accounts.length} cuenta{accounts.length !== 1 ? 's' : ''} • Total AUM: {formatCurrency(totalAUM)}
            </p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Añadir Cuenta
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay cuentas de inversión registradas</p>
            <p className="text-sm mt-1">Haz clic en "Añadir Cuenta" para comenzar</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plataforma</TableHead>
                <TableHead>Número de Cuenta</TableHead>
                <TableHead className="text-right">AUM</TableHead>
                <TableHead>Fecha de Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <div className="font-medium">{account.platform}</div>
                  </TableCell>
                  <TableCell>
                    {account.account_number ? (
                      <Badge variant="outline">{account.account_number}</Badge>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(account.aum)}
                  </TableCell>
                  <TableCell>
                    {new Date(account.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingAccount(account)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAccount(account.id)}
                        disabled={deletingAccountId === account.id}
                      >
                        <Trash2 className="h-4 w-4" />
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
    </Card>
  );
} 