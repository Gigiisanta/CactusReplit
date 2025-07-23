import { render, screen, fireEvent } from '@testing-library/react';
import AddAssetDialog from './AddAssetDialog';
jest.mock('sonner', () => ({
  toast: { error: jest.fn(), success: jest.fn(), promise: jest.fn() },
}));
describe('AddAssetDialog', () => {
  it('renders and opens dialog', () => {
    render(
      <AddAssetDialog portfolioId={1} onAssetAdded={jest.fn()}>
        <button>Abrir diálogo</button>
      </AddAssetDialog>
    );
    fireEvent.click(screen.getByText('Abrir diálogo'));
    expect(
      screen.getByText((content) => content.includes('Añadir Activo'))
    ).toBeInTheDocument();
  });
  it('submits form and shows error toast', () => {
    render(
      <AddAssetDialog portfolioId={1} onAssetAdded={jest.fn()}>
        <button>Abrir diálogo</button>
      </AddAssetDialog>
    );
    fireEvent.click(screen.getByText('Abrir diálogo'));
    expect(screen.getByText(/Añadir Activo a la Cartera/i)).toBeInTheDocument();
  });
});
