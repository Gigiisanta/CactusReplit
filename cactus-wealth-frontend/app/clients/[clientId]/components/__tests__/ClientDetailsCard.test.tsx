import { render, screen, waitFor } from '@testing-library/react';
import { ClientDetailsCard } from '../ClientDetailsCard';
import { Client, RiskProfile, ClientStatus } from '@/types';

const mockClient: Client = {
  id: 1,
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  phone: '',
  risk_profile: RiskProfile.LOW,
  status: ClientStatus.PROSPECT,
  lead_source: undefined,
  notes: '',
  live_notes: '',
  portfolio_name: 'none',
  referred_by_client_id: undefined,
  owner_id: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  portfolios: [],
  investment_accounts: [],
  insurance_policies: [],
  referred_clients: [],
};

describe('ClientDetailsCard', () => {
  it('saves client on client:save event', async () => {
    const updateClient = jest
      .fn()
      .mockResolvedValue({ ...mockClient, first_name: 'Updated' });
    const clientService = { updateClient } as any;
    const onClientUpdate = jest.fn();
    render(
      <ClientDetailsCard
        client={mockClient}
        onClientUpdate={onClientUpdate}
        onDataChange={() => {}}
        isEditing={true}
        onEditingChange={() => {}}
        clientService={clientService}
      />
    );
    window.dispatchEvent(new CustomEvent('client:save'));
    await waitFor(() => expect(updateClient).toHaveBeenCalled());
    expect(onClientUpdate).toHaveBeenCalled();
  });
});
