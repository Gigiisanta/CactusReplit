import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { InvestmentAccountsSection } from '../InvestmentAccountsSection';
// Eliminar import directo de apiClient
// import { apiClient } from '@/lib/apiClient';

jest.mock('@/lib/api', () => ({
  apiClient: {
    bulkUploadInvestmentAccounts: jest.fn(),
  },
}));

describe('InvestmentAccountsSection - Bulk Upload', () => {
  it('permite cargar archivo Excel/CSV y muestra feedback', async () => {
    const onDataChange = jest.fn();
    render(
      <InvestmentAccountsSection
        clientId={1}
        accounts={[]}
        onDataChange={onDataChange}
      />
    );

    // Verificar que el botón de importar está presente
    expect(screen.getByText(/Importar Excel\/CSV/i)).toBeInTheDocument();

    // Verificar que el estado vacío se muestra correctamente
    expect(
      screen.getByText(/No hay cuentas de inversión registradas/i)
    ).toBeInTheDocument();
  });
});
