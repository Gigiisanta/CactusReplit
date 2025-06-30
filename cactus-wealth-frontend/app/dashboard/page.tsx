import DashboardKPIs from './components/DashboardKPIs';

export default function DashboardPage() {
  return (
    <div className='space-y-6'>
      {/* Welcome Section - Server Rendered */}
      <div className='mb-8'>
        <h1 className='mb-2 text-3xl font-bold text-cactus-700'>
          Welcome back, Financial Advisor!
        </h1>
        <p className='text-gray-600'>
          Here&apos;s what&apos;s happening with your clients and portfolios today.
        </p>
      </div>

      {/* KPI Cards - Efficient Client Component */}
      <DashboardKPIs />
    </div>
  );
}
