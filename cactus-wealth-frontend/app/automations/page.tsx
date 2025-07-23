import { AutomationDashboard } from '@/components/automations/AutomationDashboard';

export default function AutomationsPage() {
  return (
    <div className='space-y-6'>
      <div className='mb-8'>
        <h1 className='mb-2 text-3xl font-bold text-cactus-700'>
          Automation & Sync
        </h1>
        <p className='text-gray-600'>
          Monitor and manage your CRM automations and sync status.
        </p>
      </div>

      <AutomationDashboard />
    </div>
  );
}
