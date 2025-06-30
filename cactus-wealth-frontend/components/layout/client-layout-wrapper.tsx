'use client';

import { usePathname } from 'next/navigation';
import { DashboardLayout } from './dashboard-layout';

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = ['/login', '/register', '/'];

export function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  const pathname = usePathname();
  
  // Check if current route is public (doesn't need dashboard layout)
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  
  if (isPublicRoute) {
    return <>{children}</>;
  }
  
  // All other routes get the dashboard layout
  return <DashboardLayout>{children}</DashboardLayout>;
} 