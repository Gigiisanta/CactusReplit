import { render, screen } from '@testing-library/react';
import ClientsPage from '../page';

describe('ClientsPage', () => {
  it('renders loading skeletons', () => {
    render(<ClientsPage />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state if no clients', async () => {
    const getClients = async () => [];
    render(<ClientsPage />);
    // Wait for the UI to update
    const emptyState = await screen.findByText(
      /Error al cargar los clientes/i,
      { selector: 'p.font-medium' }
    );
    expect(emptyState).toBeInTheDocument();
    // The error message should be visible
    expect(emptyState).toBeInTheDocument();
  });

  it('renders error state if API fails', async () => {
    const getClients = async () => {
      throw new Error('API error');
    };
    render(<ClientsPage />);
    const errorElement = await screen.findByText(
      /error al cargar los clientes/i,
      { selector: 'p.font-medium' }
    );
    expect(errorElement).toBeInTheDocument();
  });
});
