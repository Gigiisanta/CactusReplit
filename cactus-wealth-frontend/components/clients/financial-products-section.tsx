'use client';

import { Client } from '@/types';
import { AddInvestmentAccountDialog } from './add-investment-account-dialog';
import { AddInsurancePolicyDialog } from './add-insurance-policy-dialog';

interface FinancialProductsSectionProps {
  client: Client;
  onProductUpdate?: () => void;
}

export function FinancialProductsSection({
  client,
  onProductUpdate,
}: FinancialProductsSectionProps) {
  return (
    <div className='space-y-4'>
      <h4 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
        Productos Financieros
      </h4>

      <div className='space-y-3'>
        <p className='text-sm text-muted-foreground'>
          Gestiona las cuentas de inversión y pólizas de seguro del cliente.
        </p>

        <div className='flex flex-wrap gap-2'>
          <AddInvestmentAccountDialog
            clientId={client.id}
            onAccountAdded={onProductUpdate}
          />
          <AddInsurancePolicyDialog
            clientId={client.id}
            onPolicyAdded={onProductUpdate}
          />
        </div>

        {/* Current Products Display */}
        {client.investment_accounts?.length ||
        client.insurance_policies?.length ? (
          <div className='mt-4 space-y-2'>
            <p className='text-sm font-medium'>Productos actuales:</p>
            <div className='space-y-1'>
              {client.investment_accounts?.map((account) => (
                <div
                  key={account.id}
                  className='rounded bg-muted/50 p-2 text-xs text-muted-foreground'
                >
                  📈 {account.platform} - ${account.aum.toLocaleString()}
                </div>
              ))}
              {client.insurance_policies?.map((policy) => (
                <div
                  key={policy.id}
                  className='rounded bg-muted/50 p-2 text-xs text-muted-foreground'
                >
                  🛡️ {policy.insurance_type} - $
                  {policy.coverage_amount.toLocaleString()}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className='text-xs italic text-muted-foreground'>
            No hay productos financieros asociados a este cliente.
          </p>
        )}
      </div>
    </div>
  );
}
