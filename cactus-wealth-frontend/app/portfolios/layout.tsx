import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function PortfoliosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
} 