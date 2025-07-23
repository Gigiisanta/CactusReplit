import { render, screen, waitFor } from '@testing-library/react';
import { ClientTimeline } from '@/components/clients/ClientTimeline';

describe('ClientTimeline', () => {
  it('renders timeline with activities', async () => {
    render(<ClientTimeline clientId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Timeline de Actividades')).toBeInTheDocument();
    });
  });

  it('displays activity descriptions', async () => {
    render(<ClientTimeline clientId={1} />);

    await waitFor(() => {
      expect(
        screen.getByText('Estado cambiado de "Prospecto" a "Contactado"')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Cliente interesado en portfolio conservador, prefiere bonos y ETFs de bajo riesgo.'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Primera reunión agendada para el 25 de diciembre a las 10:00 AM'
        )
      ).toBeInTheDocument();
    });
  });

  it('displays activity types correctly', async () => {
    render(<ClientTimeline clientId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Cambio de estado')).toBeInTheDocument();
      expect(screen.getByText('Nota agregada')).toBeInTheDocument();
      expect(screen.getByText('Reunión agendada')).toBeInTheDocument();
    });
  });

  it('renders add activity button', async () => {
    render(<ClientTimeline clientId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Agregar Actividad')).toBeInTheDocument();
    });
  });

  it('handles different client IDs', async () => {
    render(<ClientTimeline clientId={2} />);

    await waitFor(() => {
      expect(screen.getByText('Timeline de Actividades')).toBeInTheDocument();
    });
  });

  it('displays relative timestamps', async () => {
    render(<ClientTimeline clientId={1} />);

    await waitFor(() => {
      // The component uses date-fns to format timestamps
      // We can't predict the exact text, but we can check that timestamps are displayed
      const timeElements = screen.getAllByText(/hace/);
      expect(timeElements.length).toBeGreaterThan(0);
    });
  });
});
